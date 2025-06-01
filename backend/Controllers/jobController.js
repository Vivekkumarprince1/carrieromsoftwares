const Job = require("../models/job");
const fs = require('fs');
const path = require('path');

// Create job
exports.createJob = async (req, res) => {
  console.log("Job: new");
  try {
    const { title, company, description, requirements, responsibilities, location, type, salary, questions } = req.body;
    console.log(`Job: ${title}`);
    
    if (!title || !description) {
      console.log("Missing fields");
      return res.status(400).json({ message: "Title and description are required" });
    }

    console.log('ReqBody:', req.body);

    // Parse questions if string
    let parsedQuestions = [];
    if (questions) {
      if (typeof questions === 'string') {
        try {
          parsedQuestions = JSON.parse(questions);
          console.log("Questions: parsed");
        } catch (err) {
          console.error("Parse err:", err);
          return res.status(400).json({ message: "Invalid questions format. Please provide a valid JSON array." });
        }
      } else {
        parsedQuestions = questions;
      }
    }

    // Create job
    const job = new Job({
      title,
      company,
      description,
      requirements: requirements || [],
      responsibilities: responsibilities || [],
      location,
      type,
      salary,
      questions: parsedQuestions,
      postedBy: req.user._id
    });

    // Handle image
    if (req.file) {
      console.log("Img:", req.file.filename);
      job.image = req.file.path;
      job.imageUrl = `/uploads/jobs/${req.file.filename}`;
    }

    console.log("Saving job");
    const savedJob = await job.save();
    console.log(`Created: ${savedJob._id}`);
    
    res.status(201).json({
      message: "Job posted successfully",
      job: savedJob
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Featured jobs
exports.getFeaturedJobs = async (req, res) => {
  console.log("Jobs: featured");
  try {
    // Active jobs
    const featuredJobs = await Job.find({ 
      isActive: true
    })
    .sort({ createdAt: -1 }) // Newest first
    .limit(5) // 5 max
    
    console.log(`Found: ${featuredJobs.length}`);
    res.status(200).json(featuredJobs);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// All active jobs
exports.getJobs = async (req, res) => {
  console.log("Jobs: active");
  try {
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
    console.log(`Found: ${jobs.length}`);
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Job by ID
exports.getJobById = async (req, res) => {
  console.log(`Job: ${req.params.id}`);
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      console.log(`Not found: ${req.params.id}`);
      return res.status(404).json({ message: "Job not found" });
    }
    console.log(`Found: ${job.title}`);
    res.status(200).json(job);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update job
exports.updateJob = async (req, res) => {
  console.log(`Update: ${req.params.id}`);
  try {
    // Get existing
    const existingJob = await Job.findById(req.params.id);
    if (!existingJob) {
      console.log(`Not found: ${req.params.id}`);
      return res.status(404).json({ message: "Job not found" });
    }
    
    const updates = req.body;
    updates.updatedAt = Date.now();
    console.log(`Fields: ${Object.keys(updates).join(', ')}`);
    
    // Parse questions if string
    if (typeof updates.questions === 'string') {
      try {
        updates.questions = JSON.parse(updates.questions);
        console.log("Questions: parsed");
      } catch (err) {
        console.error("Parse err:", err);
        return res.status(400).json({ message: "Invalid questions format. Please provide a valid JSON array." });
      }
    }
    
    // Handle image
    if (req.file) {
      console.log("Img updated:", req.file.filename);
      // Set new paths
      updates.image = req.file.path;
      updates.imageUrl = `/uploads/jobs/${req.file.filename}`;
      
      // Delete old
      if (existingJob.image) {
        try {
          if (fs.existsSync(existingJob.image)) {
            fs.unlinkSync(existingJob.image);
            console.log("Old img deleted");
          } else {
            console.log("Old img not found");
          }
        } catch (err) {
          console.error("Delete err:", err);
        }
      }
    } else {
      // Keep existing images
      delete updates.image;
      delete updates.imageUrl;
    }
    
    // Update job
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    console.log(`Updated: ${job.title}`);
    console.log("Images:", { 
      image: job.image || 'none', 
      imageUrl: job.imageUrl || 'none' 
    });
    
    res.status(200).json({
      message: "Job updated successfully",
      job
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete job
exports.deleteJob = async (req, res) => {
  console.log(`Delete: ${req.params.id}`);
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!job) {
      console.log(`Not found: ${req.params.id}`);
      return res.status(404).json({ message: "Job not found" });
    }
    
    console.log(`Deactivated: ${job.title}`);
    res.status(200).json({
      message: "Job deleted successfully"
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all jobs
exports.getAllJobs = async (req, res) => {
  console.log("Admin: all jobs");
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    console.log(`Found: ${jobs.length}`);
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Search jobs
exports.searchJobs = async (req, res) => {
  console.log("Search jobs");
  try {
    const { query } = req.query;
    
    if (!query) {
      console.log("No query");
      return res.status(400).json({ message: "Search query is required" });
    }
    
    console.log(`Query: "${query}"`);
    
    const jobs = await Job.find({
      isActive: true,
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`Found: ${jobs.length}`);
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Filter jobs
exports.filterJobs = async (req, res) => {
  console.log("Filter jobs");
  try {
    const { location, type, minSalary, maxSalary } = req.query;
    const filter = { isActive: true };
    
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (minSalary || maxSalary) {
      filter.salary = {};
      if (minSalary) filter.salary.$gte = parseInt(minSalary);
      if (maxSalary) filter.salary.$lte = parseInt(maxSalary);
    }
    
    console.log("Criteria:", filter);
    
    const jobs = await Job.find(filter).sort({ createdAt: -1 });
    
    console.log(`Found: ${jobs.length}`);
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Sort jobs
exports.sortJobs = async (req, res) => {
  console.log("Sort jobs");
  try {
    const { sortBy, order } = req.query;
    const sortOrder = order?.toLowerCase() === 'desc' ? -1 : 1;
    
    let sortCriteria = { createdAt: -1 }; // Default
    
    if (sortBy) {
      sortCriteria = {};
      sortCriteria[sortBy] = sortOrder;
    }
    
    console.log(`Sort: ${Object.keys(sortCriteria)[0]}, ${sortOrder === 1 ? 'asc' : 'desc'}`);
    
    const jobs = await Job.find({ isActive: true }).sort(sortCriteria);
    
    console.log(`Sorted: ${jobs.length}`);
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add question
exports.addJobQuestion = async (req, res) => {
  console.log(`Add Q: ${req.params.jobId}`);
  try {
    const { jobId } = req.params;
    const { questionText, questionType, required, options, maxRating, order } = req.body;
    
    // Validate
    if (!questionText || !questionType) {
      console.log("Missing fields");
      return res.status(400).json({ message: "Question text and type are required" });
    }
    
    // Check type
    const validTypes = ["text", "multipleChoice", "checkbox", "file", "rating"];
    if (!validTypes.includes(questionType)) {
      console.log(`Invalid type: ${questionType}`);
      return res.status(400).json({ 
        message: "Invalid question type. Must be one of: text, multipleChoice, checkbox, file, rating" 
      });
    }
    
    // Check options
    if ((questionType === "multipleChoice" || questionType === "checkbox") && 
        (!options || !Array.isArray(options) || options.length === 0)) {
      console.log("Options required");
      return res.status(400).json({ 
        message: "Options are required for multiple choice or checkbox questions" 
      });
    }
    
    const job = await Job.findById(jobId);
    if (!job) {
      console.log(`Job not found: ${jobId}`);
      return res.status(404).json({ message: "Job not found" });
    }
    
    // Create question
    const newQuestion = {
      questionText,
      questionType,
      required: required || false,
      options: options || [],
      maxRating: maxRating || 5,
      order: order || (job.questions.length > 0 ? Math.max(...job.questions.map(q => q.order)) + 1 : 0)
    };
    
    // Add to job
    job.questions.push(newQuestion);
    job.updatedAt = Date.now();
    
    await job.save();
    console.log(`Q added: ${jobId}`);
    
    res.status(201).json({
      message: "Question added successfully",
      job
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update question
exports.updateJobQuestion = async (req, res) => {
  console.log(`Update Q: ${req.params.jobId}`);
  try {
    const { jobId } = req.params;
    const { questionId } = req.params;
    const { questionText, questionType, required, options, maxRating, order } = req.body;
    
    const job = await Job.findById(jobId);
    if (!job) {
      console.log(`Job not found: ${jobId}`);
      return res.status(404).json({ message: "Job not found" });
    }
    
    // Find question
    const questionIndex = job.questions.findIndex(q => q._id.toString() === questionId);
    if (questionIndex === -1) {
      console.log(`Q not found: ${questionId}`);
      return res.status(404).json({ message: "Question not found" });
    }
    
    // Update fields
    if (questionText) job.questions[questionIndex].questionText = questionText;
    if (questionType) job.questions[questionIndex].questionType = questionType;
    if (required !== undefined) job.questions[questionIndex].required = required;
    if (options) job.questions[questionIndex].options = options;
    if (maxRating) job.questions[questionIndex].maxRating = maxRating;
    if (order !== undefined) job.questions[questionIndex].order = order;
    
    job.updatedAt = Date.now();
    await job.save();
    console.log(`Q updated: ${jobId}`);
    
    res.status(200).json({
      message: "Question updated successfully",
      job
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete question
exports.deleteJobQuestion = async (req, res) => {
  console.log(`Delete Q: ${req.params.jobId}`);
  try {
    const { jobId, questionId } = req.params;
    
    const job = await Job.findById(jobId);
    if (!job) {
      console.log(`Job not found: ${jobId}`);
      return res.status(404).json({ message: "Job not found" });
    }
    
    // Remove question
    const initialLength = job.questions.length;
    job.questions = job.questions.filter(q => q._id.toString() !== questionId);
    
    if (job.questions.length === initialLength) {
      console.log(`Q not found: ${questionId}`);
      return res.status(404).json({ message: "Question not found" });
    }
    
    job.updatedAt = Date.now();
    await job.save();
    console.log(`Q deleted: ${jobId}`);
    
    res.status(200).json({
      message: "Question deleted successfully",
      job
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Reorder questions
exports.reorderJobQuestions = async (req, res) => {
  console.log(`Reorder Q: ${req.params.jobId}`);
  try {
    const { jobId } = req.params;
    const { questionOrder } = req.body;
    
    if (!questionOrder || !Array.isArray(questionOrder)) {
      console.log("Invalid order");
      return res.status(400).json({ message: "Question order must be an array of question IDs" });
    }
    
    const job = await Job.findById(jobId);
    if (!job) {
      console.log(`Job not found: ${jobId}`);
      return res.status(404).json({ message: "Job not found" });
    }
    
    // Map for lookup
    const questionsMap = {};
    job.questions.forEach(q => {
      questionsMap[q._id.toString()] = q;
    });
    
    // Reorder questions
    const reorderedQuestions = [];
    for (let i = 0; i < questionOrder.length; i++) {
      const qId = questionOrder[i];
      if (questionsMap[qId]) {
        const question = questionsMap[qId];
        question.order = i;
        reorderedQuestions.push(question);
        delete questionsMap[qId];
      }
    }
    
    // Add remaining
    Object.values(questionsMap).forEach(q => {
      reorderedQuestions.push(q);
    });
    
    job.questions = reorderedQuestions;
    job.updatedAt = Date.now();
    await job.save();
    console.log(`Q reordered: ${jobId}`);
    
    res.status(200).json({
      message: "Questions reordered successfully",
      job
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get questions
exports.getJobQuestions = async (req, res) => {
  console.log(`Get Q: ${req.params.jobId}`);
  try {
    const { jobId } = req.params;
    
    const job = await Job.findById(jobId);
    if (!job) {
      console.log(`Job not found: ${jobId}`);
      return res.status(404).json({ message: "Job not found" });
    }
    
    // Sort by order
    const sortedQuestions = [...job.questions].sort((a, b) => a.order - b.order);
    
    console.log(`Found: ${sortedQuestions.length}`);
    res.status(200).json(sortedQuestions);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};