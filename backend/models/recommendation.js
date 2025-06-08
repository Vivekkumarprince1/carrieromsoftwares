const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema({
  recommender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  recommenderId: { 
    type: String, 
    required: true 
  },
  recommendedUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  recommendedUserEmail: { 
    type: String, 
    required: true 
  },
  recommendedUserName: { 
    type: String, 
    required: true 
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },
  status: { 
    type: String, 
    enum: ["pending", "reviewed", "selected", "rejected"], 
    default: "pending" 
  },
  recommendationMessage: { 
    type: String, 
    maxlength: 500 
  },
  adminNotes: { 
    type: String, 
    maxlength: 500 
  },
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  reviewedAt: { 
    type: Date 
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application"
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for efficient queries
recommendationSchema.index({ recommender: 1, status: 1 });
recommendationSchema.index({ recommendedUser: 1 });
recommendationSchema.index({ jobId: 1, status: 1 });
recommendationSchema.index({ status: 1, createdAt: -1 });

// Virtual for active recommendations count per user
recommendationSchema.statics.getActivePendingCount = function(recommenderId) {
  return this.countDocuments({ 
    recommender: recommenderId, 
    status: 'pending' 
  });
};

module.exports = mongoose.model("Recommendation", recommendationSchema);
