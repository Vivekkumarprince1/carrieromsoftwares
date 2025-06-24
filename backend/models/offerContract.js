const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema({
  // Link to offer letter and application
  offerLetterId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "OfferLetter", 
    required: true 
  },
  applicationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Application", 
    required: true 
  },
  
  // Candidate personal information
  candidateName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  
  // Personal Details
  personalInfo: {
    dateOfBirth: { type: Date, required: true },
    nationality: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true, default: 'India' }
    },
    emergencyContact: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String }
    },
    identificationDocuments: {
      idType: { 
        type: String, 
        enum: ['Aadhar', 'PAN', 'Passport', 'Driving License', 'Voter ID'], 
        required: true 
      },
      idNumber: { type: String, required: true },
      // For document uploads
      documentUrl: { type: String },
      cloudinaryPublicId: { type: String }
    }
  },
  
  // Banking Information
  bankingInfo: {
    accountHolderName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    bankName: { type: String, required: true },
    ifscCode: { type: String, required: true },
    accountType: { 
      type: String, 
      enum: ['Savings', 'Current'], 
      required: true 
    },
    branch: { type: String, required: true }
  },
  
  // Employment Details (copied from offer letter but can be modified)
  employmentDetails: {
    position: { type: String, required: true },
    department: { type: String, required: true },
    salary: { type: Number, required: true },
    startDate: { type: Date, required: true },
    joiningLocation: { type: String, required: true },
    workType: { 
      type: String, 
      enum: ['Remote', 'On-site', 'Hybrid'], 
      required: true 
    },
    reportingManager: { type: String }
  },
  
  // Contract status and workflow
  status: {
    type: String,
    enum: ['Draft', 'Under_Review', 'Approved', 'Rejected', 'Requires_Clarification'],
    default: 'Under_Review'
  },
  
  // Workflow status tracking
  workflowStatus: {
    currentStage: {
      type: String,
      enum: ['submitted', 'under_review', 'approved', 'rejected', 'requires_changes'],
      default: 'submitted'
    },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    stages: {
      submitted: {
        completedAt: { type: Date },
        completedBy: { type: String }
      },
      under_review: {
        completedAt: { type: Date },
        completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
      },
      approved: {
        completedAt: { type: Date },
        completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
      },
      rejected: {
        completedAt: { type: Date },
        completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: { type: String }
      }
    }
  },
  
  // Contract acceptance details
  acceptedAt: { type: Date, default: Date.now },
  acceptanceComments: { type: String },
  
  // Admin review details
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date },
  adminComments: { type: String },
  
  // Document attachments
  documents: [{
    documentType: { 
      type: String, 
      enum: ['ID_Proof', 'Address_Proof', 'Educational_Certificate', 'Experience_Letter', 'Other'],
      required: true 
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Legal and compliance
  agreementTerms: {
    termsAccepted: { type: Boolean, required: true, default: false },
    privacyPolicyAccepted: { type: Boolean, required: true, default: false },
    acceptedAt: { type: Date },
    ipAddress: { type: String }
  }
}, {
  timestamps: true
});

// Indexes for performance
contractSchema.index({ offerLetterId: 1 });
contractSchema.index({ email: 1 });
contractSchema.index({ status: 1 });
contractSchema.index({ createdAt: -1 });

module.exports = mongoose.model("EmploymentContract", contractSchema);
