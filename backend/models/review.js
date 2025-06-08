const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  userEmail: { 
    type: String, 
    required: true 
  },
  userName: { 
    type: String, 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  title: { 
    type: String, 
    required: true,
    maxlength: 100
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  department: { 
    type: String, 
    required: false 
  },
  position: { 
    type: String, 
    required: false 
  },
  workType: { 
    type: String, 
    enum: ['Remote', 'On-site', 'Hybrid'], 
    required: false 
  },
  employmentDuration: { 
    type: String, 
    required: false 
  },
  pros: { 
    type: String, 
    maxlength: 500 
  },
  cons: { 
    type: String, 
    maxlength: 500 
  },
  advice: { 
    type: String, 
    maxlength: 500 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  reviewerType: {
    type: String,
    enum: ['employee', 'offer_recipient'],
    required: true
  },
  isAnonymous: { 
    type: Boolean, 
    default: false 
  },
  moderatorNotes: { 
    type: String 
  },
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  approvedAt: { 
    type: Date 
  },
  rejectedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  rejectedAt: { 
    type: Date 
  },
  rejectionReason: { 
    type: String 
  }
}, {
  timestamps: true
});

// Index for efficient querying
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ rating: 1 });

module.exports = mongoose.model("Review", reviewSchema);
