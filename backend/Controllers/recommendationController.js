const Recommendation = require("../models/recommendation");
const User = require("../models/user");
const Application = require("../models/application");

// Create a new recommendation for job applications
const createRecommendation = async (req, res) => {
  try {
    const { recommendedUserEmail, recommendedUserName, jobId, recommendationMessage } = req.body;
    const recommenderId = req.user.id || req.user._id;

    console.log('Creating recommendation for user:', recommenderId);
    console.log('Request body:', req.body);

    // Verify recommender is an employee only (not interns)
    const recommender = await User.findById(recommenderId);
    if (!recommender || recommender.employeeStatus !== 'employee') {
      return res.status(403).json({
        success: false,
        message: "Only current employees can make job recommendations"
      });
    }

    // Check if recommender has reached the limit of 5 pending recommendations
    const pendingCount = await Recommendation.getActivePendingCount(recommenderId);
    if (pendingCount >= 5) {
      return res.status(400).json({
        success: false,
        message: "You have reached the maximum limit of 5 pending recommendations. Please wait for admin review."
      });
    }

    // Find existing application based on email and job
    const existingApplication = await Application.findOne({
      email: recommendedUserEmail,
      jobId: jobId
    }).populate('jobId', 'title department location');

    if (!existingApplication) {
      return res.status(400).json({
        success: false,
        message: "No application found for this candidate and job. Candidates must apply first before being recommended."
      });
    }

    // Check if the employee is trying to recommend their own application
    if (existingApplication.userId && existingApplication.userId.toString() === recommenderId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot recommend your own job application"
      });
    }

    // Check if application already has a recommendation
    if (existingApplication.recommendationId) {
      return res.status(400).json({
        success: false,
        message: "This application already has a recommendation"
      });
    }

    // Check if this recommender has already recommended this application
    const existingRecommendation = await Recommendation.findOne({
      recommender: recommenderId,
      applicationId: existingApplication._id
    });

    if (existingRecommendation) {
      return res.status(400).json({
        success: false,
        message: "You have already recommended this application"
      });
    }

    // Find or create the recommended user
    let recommendedUser = await User.findOne({ email: recommendedUserEmail });
    if (!recommendedUser) {
      // Create a basic user record for the recommended person
      const bcrypt = require('bcryptjs');
      const tempPassword = Math.random().toString(36).slice(-8); // Generate temporary password
      const hashedTempPassword = await bcrypt.hash(tempPassword, 10);
      
      recommendedUser = new User({
        name: recommendedUserName,
        email: recommendedUserEmail,
        password: hashedTempPassword, // Temporary password that will be reset on first login
        employeeStatus: 'applicant'
      });
      await recommendedUser.save();
      console.log(`Created user for recommended candidate: ${recommendedUserEmail} with temp password`);
    }

    // Create new job recommendation and automatically link with the application
    const newRecommendation = new Recommendation({
      recommender: recommenderId,
      recommenderId: recommender.employeeId,
      recommendedUser: recommendedUser._id,
      recommendedUserEmail,
      recommendedUserName,
      recommendationMessage,
      jobId: jobId,
      applicationId: existingApplication._id // Automatically link to the existing application
    });

    await newRecommendation.save();

    console.log('Recommendation created successfully:', newRecommendation._id);

    // Update the application with referral information
    existingApplication.recommendationId = newRecommendation._id;
    existingApplication.isReferred = true;
    existingApplication.referrerEmployeeId = recommender.employeeId;
    existingApplication.referralMessage = recommendationMessage;
    await existingApplication.save();

    console.log('Automatically linked recommendation with existing application:', existingApplication._id);

    res.status(201).json({
      success: true,
      message: "Job recommendation submitted successfully",
      data: newRecommendation
    });
  } catch (error) {
    console.error("Error creating recommendation:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating recommendation"
    });
  }
};

// Get recommendations made by current user
const getMyRecommendations = async (req, res) => {
  try {
    const recommenderId = req.user.id || req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    console.log('Getting recommendations for user:', recommenderId);

    // Build query
    let query = { recommender: recommenderId };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const recommendations = await Recommendation.find(query)
      .populate('recommendedUser', 'name email')
      .populate('reviewedBy', 'name')
      .populate('jobId', 'title department location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Recommendation.countDocuments(query);
    const pendingCount = await Recommendation.getActivePendingCount(recommenderId);

    console.log(`Found ${recommendations.length} recommendations, ${pendingCount} pending`);

    res.json({
      success: true,
      data: {
        recommendations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCount: total,
          pendingCount
        }
      }
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching recommendations"
    });
  }
};

// Get all recommendations (Admin only)
const getAllRecommendations = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;

    // Build query
    let query = {};
    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { recommendedUserName: { $regex: search, $options: 'i' } },
        { recommendedUserEmail: { $regex: search, $options: 'i' } },
        { recommenderId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const recommendations = await Recommendation.find(query)
      .populate('recommender', 'name email employeeId department position')
      .populate('recommendedUser', 'name email employeeStatus')
      .populate('reviewedBy', 'name')
      .populate('jobId', 'title department location requirements')
      .populate('applicationId', 'status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Recommendation.countDocuments(query);

    // Get status counts
    const statusCounts = await Recommendation.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        recommendations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCount: total
        },
        statusCounts
      }
    });
  } catch (error) {
    console.error("Error fetching all recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching recommendations"
    });
  }
};

// Update recommendation status (Admin only)
const updateRecommendationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const reviewerId = req.user.id;

    if (!['reviewed', 'selected', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'reviewed', 'selected', or 'rejected'"
      });
    }

    const recommendation = await Recommendation.findById(id).populate('recommender', 'name email');
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: "Recommendation not found"
      });
    }

    // Update recommendation
    recommendation.status = status;
    recommendation.adminNotes = adminNotes;
    recommendation.reviewedBy = reviewerId;
    recommendation.reviewedAt = new Date();
    recommendation.updatedAt = new Date();

    await recommendation.save();

    // If selected, create job application for the recommended user and link them
    if (status === 'selected') {
      // Check if the recommended user already has an application for this job
      let existingApplication = await Application.findOne({
        email: recommendation.recommendedUserEmail,
        jobId: recommendation.jobId
      });

      if (!existingApplication) {
        // Get the recommended user's details for required fields
        const recommendedUser = await User.findById(recommendation.recommendedUser);
        
        // Create new application with referral information
        const newApplication = new Application({
          userId: recommendation.recommendedUser,
          jobId: recommendation.jobId,
          fullName: recommendation.recommendedUserName || recommendedUser?.name || 'N/A',
          email: recommendation.recommendedUserEmail || recommendedUser?.email || 'N/A',
          phone: recommendedUser?.phone || 'N/A',
          isReferred: true,
          referrerEmployeeId: recommendation.recommenderId,
          referrerName: recommendation.recommender?.name,
          referrerEmail: recommendation.recommender?.email,
          referralMessage: recommendation.recommendationMessage,
          recommendationId: recommendation._id,
          status: 'pending'
        });
        const savedApplication = await newApplication.save();
        
        // Update recommendation with application reference
        recommendation.applicationId = savedApplication._id;
      } else {
        // Update existing application with referral information
        await Application.findByIdAndUpdate(existingApplication._id, {
          isReferred: true,
          referrerEmployeeId: recommendation.recommenderId,
          referrerName: recommendation.recommender?.name,
          referrerEmail: recommendation.recommender?.email,
          referralMessage: recommendation.recommendationMessage,
          recommendationId: recommendation._id
        });
        
        // Update recommendation with application reference
        recommendation.applicationId = existingApplication._id;
      }
    }

    const updatedRecommendation = await Recommendation.findById(id)
      .populate('recommender', 'name email employeeId')
      .populate('recommendedUser', 'name email')
      .populate('reviewedBy', 'name')
      .populate('jobId', 'title department location');

    res.json({
      success: true,
      message: "Recommendation status updated successfully",
      data: updatedRecommendation
    });
  } catch (error) {
    console.error("Error updating recommendation status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating recommendation status"
    });
  }
};

// Delete recommendation (User can only delete their own pending recommendations)
const deleteRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;
    const isAdmin = req.user.role === 'admin';

    console.log(`Delete recommendation requested - ID: ${id}, User: ${userId}, isAdmin: ${isAdmin}`);

    const recommendation = await Recommendation.findById(id);
    if (!recommendation) {
      console.log(`Recommendation not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: "Recommendation not found"
      });
    }

    console.log(`Found recommendation - ID: ${recommendation._id}, recommender: ${recommendation.recommender}, status: ${recommendation.status}`);

    // Check permissions
    if (!isAdmin && recommendation.recommender.toString() !== userId.toString()) {
      console.log(`Permission denied - recommendation.recommender: ${recommendation.recommender}, userId: ${userId}`);
      return res.status(403).json({
        success: false,
        message: "You can only delete your own recommendations"
      });
    }

    // Users can only delete pending recommendations
    if (!isAdmin && recommendation.status !== 'pending') {
      console.log(`Status check failed - status: ${recommendation.status}, admin: ${isAdmin}`);
      return res.status(400).json({
        success: false,
        message: "You can only delete pending recommendations"
      });
    }

    console.log(`Deleting recommendation: ${id}`);
    await Recommendation.findByIdAndDelete(id);

    console.log(`Recommendation deleted successfully: ${id}`);
    res.json({
      success: true,
      message: "Recommendation deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting recommendation:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting recommendation"
    });
  }
};

// Get recommendation statistics (Admin only)
const getRecommendationStats = async (req, res) => {
  try {
    const stats = await Recommendation.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          reviewed: { $sum: { $cond: [{ $eq: ['$status', 'reviewed'] }, 1, 0] } },
          selected: { $sum: { $cond: [{ $eq: ['$status', 'selected'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      }
    ]);

    // Get top recommenders
    const topRecommenders = await Recommendation.aggregate([
      {
        $group: {
          _id: '$recommender',
          count: { $sum: 1 },
          selectedCount: { $sum: { $cond: [{ $eq: ['$status', 'selected'] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'recommender'
        }
      },
      {
        $unwind: '$recommender'
      },
      {
        $project: {
          name: '$recommender.name',
          employeeId: '$recommender.employeeId',
          totalRecommendations: '$count',
          selectedRecommendations: '$selectedCount'
        }
      },
      { $sort: { totalRecommendations: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        stats: stats[0] || {
          total: 0,
          pending: 0,
          reviewed: 0,
          selected: 0,
          rejected: 0
        },
        topRecommenders
      }
    });
  } catch (error) {
    console.error("Error fetching recommendation stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching recommendation statistics"
    });
  }
};

// Link existing applications with recommendations (Admin utility function)
const linkExistingApplications = async (req, res) => {
  try {
    // Find all recommendations that don't have applicationId but are selected
    const selectedRecommendations = await Recommendation.find({
      status: 'selected',
      applicationId: { $exists: false }
    }).populate('recommendedUser');

    let linkedCount = 0;

    for (const recommendation of selectedRecommendations) {
      // Find application by email and jobId
      const application = await Application.findOne({
        email: recommendation.recommendedUserEmail,
        jobId: recommendation.jobId
      });

      if (application) {
        // Update both recommendation and application
        await Recommendation.findByIdAndUpdate(recommendation._id, {
          applicationId: application._id
        });

        await Application.findByIdAndUpdate(application._id, {
          recommendationId: recommendation._id,
          isReferred: true,
          referrerEmployeeId: recommendation.recommenderId,
          referralMessage: recommendation.recommendationMessage
        });

        linkedCount++;
      }
    }

    res.json({
      success: true,
      message: `Successfully linked ${linkedCount} recommendations with applications`,
      data: { linkedCount }
    });
  } catch (error) {
    console.error("Error linking applications:", error);
    res.status(500).json({
      success: false,
      message: "Server error while linking applications"
    });
  }
};

module.exports = {
  createRecommendation,
  getMyRecommendations,
  getAllRecommendations,
  updateRecommendationStatus,
  deleteRecommendation,
  getRecommendationStats,
  linkExistingApplications
};
