const Notification = require("../models/notification");
const Application = require("../models/application");
const Job = require("../models/job");

// Get notifications for the current user
exports.getUserNotifications = async (req, res) => {
  console.log("Get: user notifications");
  try {
    const userId = req.user.userId || req.user._id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    console.log(`Fetching notifications for user: ${userId}`);

    const filter = { userId };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .populate('relatedJobId', 'title company department')
      .populate('relatedApplicationId', 'status createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    console.log(`Found ${notifications.length} notifications for user`);

    res.status(200).json({
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        unreadCount
      }
    });
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    res.status(500).json({ 
      message: "Failed to fetch notifications", 
      error: error.message 
    });
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  console.log("Mark: notification as read", req.params.notificationId);
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId || req.user._id;

    const notification = await Notification.findOne({
      _id: notificationId,
      userId: userId
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.markAsRead();
    console.log(`Notification ${notificationId} marked as read`);

    res.status(200).json({
      message: "Notification marked as read",
      notification
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ 
      message: "Failed to mark notification as read", 
      error: error.message 
    });
  }
};

// Mark all notifications as read for user
exports.markAllNotificationsAsRead = async (req, res) => {
  console.log("Mark: all notifications as read");
  try {
    const userId = req.user.userId || req.user._id;

    const result = await Notification.updateMany(
      { userId: userId, isRead: false },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    console.log(`Marked ${result.modifiedCount} notifications as read for user ${userId}`);

    res.status(200).json({
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ 
      message: "Failed to mark all notifications as read", 
      error: error.message 
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  console.log("Delete: notification", req.params.notificationId);
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId || req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId: userId
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    console.log(`Notification ${notificationId} deleted`);

    res.status(200).json({
      message: "Notification deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ 
      message: "Failed to delete notification", 
      error: error.message 
    });
  }
};

// Get unread notification count
exports.getUnreadNotificationCount = async (req, res) => {
  console.log("Get: unread notification count");
  try {
    const userId = req.user.userId || req.user._id;

    const unreadCount = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    });

    console.log(`User ${userId} has ${unreadCount} unread notifications`);

    res.status(200).json({
      unreadCount
    });
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    res.status(500).json({ 
      message: "Failed to get unread notification count", 
      error: error.message 
    });
  }
};

// Admin: Get all notifications (for admin dashboard)
exports.getAllNotifications = async (req, res) => {
  console.log("Admin: get all notifications");
  try {
    const { page = 1, limit = 50, type, userId } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (userId) filter.userId = userId;

    const notifications = await Notification.find(filter)
      .populate('userId', 'name email')
      .populate('relatedJobId', 'title company')
      .populate('relatedApplicationId', 'status')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(filter);

    console.log(`Found ${notifications.length} notifications (admin view)`);

    res.status(200).json({
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    res.status(500).json({ 
      message: "Failed to fetch notifications", 
      error: error.message 
    });
  }
};

// Helper function to create job update notifications for all applicants
exports.createJobUpdateNotifications = async (jobId, oldJobData, newJobData) => {
  console.log(`Creating job update notifications for job: ${jobId}`);
  try {
    // Find all applications for this job
    const applications = await Application.find({ 
      jobId: jobId,
      status: { $in: ['pending', 'reviewing', 'shortlisted'] } // Only notify active applicants
    }).populate('userId', '_id');

    if (applications.length === 0) {
      console.log(`No active applications found for job ${jobId}`);
      return;
    }

    // Detect what changed
    const changedFields = [];
    const updateDetails = {
      jobTitle: newJobData.title,
      changedFields: [],
      updateType: "other"
    };

    // Check if requirements changed
    const oldReqs = Array.isArray(oldJobData.requirements) ? oldJobData.requirements : [];
    const newReqs = Array.isArray(newJobData.requirements) ? newJobData.requirements : [];
    
    if (JSON.stringify(oldReqs.sort()) !== JSON.stringify(newReqs.sort())) {
      changedFields.push('requirements');
      updateDetails.oldRequirements = oldReqs;
      updateDetails.newRequirements = newReqs;
    }

    // Check if responsibilities changed
    const oldResps = Array.isArray(oldJobData.responsibilities) ? oldJobData.responsibilities : [];
    const newResps = Array.isArray(newJobData.responsibilities) ? newJobData.responsibilities : [];
    
    if (JSON.stringify(oldResps.sort()) !== JSON.stringify(newResps.sort())) {
      changedFields.push('responsibilities');
      updateDetails.oldResponsibilities = oldResps;
      updateDetails.newResponsibilities = newResps;
    }

    // Determine update type
    if (changedFields.includes('requirements') && changedFields.includes('responsibilities')) {
      updateDetails.updateType = "both";
    } else if (changedFields.includes('requirements')) {
      updateDetails.updateType = "requirements";
    } else if (changedFields.includes('responsibilities')) {
      updateDetails.updateType = "responsibilities";
    }

    updateDetails.changedFields = changedFields;

    // Only create notifications if requirements or responsibilities changed
    if (changedFields.length === 0) {
      console.log(`No significant changes detected for job ${jobId}`);
      return;
    }

    console.log(`Creating notifications for ${applications.length} applicants about ${updateDetails.updateType} changes`);

    // Create notifications for all applicants
    const notificationPromises = applications.map(application => {
      if (application.userId) {
        return Notification.createJobUpdateNotification(
          application.userId._id,
          jobId,
          application._id,
          updateDetails
        );
      }
    }).filter(Boolean); // Remove null/undefined promises

    await Promise.all(notificationPromises);
    console.log(`Successfully created ${notificationPromises.length} job update notifications`);

  } catch (error) {
    console.error("Error creating job update notifications:", error);
    throw error;
  }
};
