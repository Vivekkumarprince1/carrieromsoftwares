const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  type: { 
    type: String, 
    enum: ["job_update", "application_status", "system"], 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  relatedJobId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Job" 
  },
  relatedApplicationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Application" 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  readAt: { 
    type: Date 
  },
  // Job update specific fields
  jobUpdateDetails: {
    oldRequirements: [String],
    newRequirements: [String],
    oldResponsibilities: [String],
    newResponsibilities: [String],
    changedFields: [String], // Array of field names that changed
    updateType: { 
      type: String, 
      enum: ["requirements", "responsibilities", "both", "other"],
      default: "other"
    }
  },
  priority: { 
    type: String, 
    enum: ["low", "medium", "high"], 
    default: "medium" 
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ relatedJobId: 1 });

// Mark notification as read
notificationSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to create job update notification
notificationSchema.statics.createJobUpdateNotification = function(userId, jobId, applicationId, updateDetails) {
  const title = "Job Requirements Updated";
  const jobTitle = updateDetails.jobTitle || "Job";
  
  let message = `The job "${jobTitle}" you applied for has been updated. `;
  
  if (updateDetails.updateType === "requirements") {
    message += "The job requirements have been modified. Please review the updated requirements and consider updating your application or skills accordingly.";
  } else if (updateDetails.updateType === "responsibilities") {
    message += "The job responsibilities have been modified. Please review the updated responsibilities to better understand the role.";
  } else if (updateDetails.updateType === "both") {
    message += "Both job requirements and responsibilities have been modified. Please review the updates and consider updating your application or skills accordingly.";
  } else {
    message += "Important details about this job have been updated. Please review the changes.";
  }

  return this.create({
    userId,
    type: "job_update",
    title,
    message,
    relatedJobId: jobId,
    relatedApplicationId: applicationId,
    jobUpdateDetails: updateDetails,
    priority: updateDetails.updateType === "requirements" ? "high" : "medium"
  });
};

module.exports = mongoose.model("Notification", notificationSchema);
