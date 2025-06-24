const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Reference to the user who applied
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  resume: { type: String }, // Path to uploaded resume (legacy)
  resumeUrl: { type: String }, // URL to access the resume
  cloudinaryPublicId: { type: String }, // Cloudinary public ID for resume
  experience: String,
  education: String,
  skills: [String],
  coverLetter: String,
  // Referral fields
  isReferred: { type: Boolean, default: false },
  // Recommendation reference for employee recommendations
  recommendationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Recommendation"
  },
  // Add field for question answers
  questionAnswers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId },
    questionText: { type: String },
    questionType: { type: String, enum: ["text", "multipleChoice", "checkbox", "file", "rating"] },
    answer: { type: mongoose.Schema.Types.Mixed }, // Can store different types of answers
    fileUrl: { type: String }, // For file type questions
    cloudinaryPublicId: { type: String } // Cloudinary public ID for file uploads
  }],
  status: { 
    type: String, 
    enum: ["pending", "reviewing", "shortlisted", "rejected", "offered", "hired"], 
    default: "pending" 
  },
  offerLetter: { type: String }, // Path to generated offer letter (legacy)
  offerLetterId: { type: mongoose.Schema.Types.ObjectId, ref: "OfferLetter" }, // Reference to offer letter record
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Application", applicationSchema);