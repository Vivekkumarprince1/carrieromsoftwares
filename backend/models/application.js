const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Reference to the user who applied
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  resume: { type: String }, // Path to uploaded resume
  resumeUrl: { type: String }, // URL to access the resume
  experience: String,
  education: String,
  skills: [String],
  coverLetter: String,
  // Add field for question answers
  questionAnswers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId },
    questionText: { type: String },
    questionType: { type: String, enum: ["text", "multipleChoice", "checkbox", "file", "rating"] },
    answer: { type: mongoose.Schema.Types.Mixed }, // Can store different types of answers
    fileUrl: { type: String } // For file type questions
  }],
  status: { 
    type: String, 
    enum: ["pending", "reviewing", "shortlisted", "rejected", "offered", "hired"], 
    default: "pending" 
  },
  offerLetter: { type: String }, // Path to generated offer letter
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Application", applicationSchema);