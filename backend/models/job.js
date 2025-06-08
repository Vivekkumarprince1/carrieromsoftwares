const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  requirements: [String],
  responsibilities: [String],
  location: String,
  type: { type: String, enum: ["Full-time", "Part-time", "Contract", "Internship"] },
  salary: { type: String },
  department: { type: String },
  position: { type: String },
  // Cloudinary image fields
  imageUrl: { type: String }, // Cloudinary URL to access the image
  cloudinaryPublicId: { type: String }, // Cloudinary public ID for deletion
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isActive: { type: Boolean, default: true },
  // Adding questions field for application form
  questions: [{
    questionText: { type: String, required: true },
    questionType: { 
      type: String, 
      enum: ["text", "multipleChoice", "checkbox", "file", "rating"],
      required: true 
    },
    required: { type: Boolean, default: false },
    options: [String], // For multiple choice or checkbox questions
    maxRating: { type: Number, default: 5 }, // For rating questions
    order: { type: Number, default: 0 } // To control question display order
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Job", jobSchema);