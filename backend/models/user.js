const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user", enum: ["user", "admin"] },
  specialAuthority: { 
    type: Boolean,
    default: false // New field for special authority, default to false  
  }, // New field for special authority
  employeeStatus: { 
    type: String, 
    enum: ["applicant", "offer_recipient", "employee", "former_employee"], 
    default: "applicant" 
  },
  accountStatus: {
    type: String,
    enum: ["active", "inactive", "pending", "suspended"],
    default: "pending"
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationOTP: {
    type: String,
    default: null
  },
  emailVerificationOTPExpiry: {
    type: Date,
    default: null
  },
  passwordResetOTP: {
    type: String,
    default: null
  },
  passwordResetOTPExpiry: {
    type: Date,
    default: null
  },
  moreInfo: { type: mongoose.Schema.Types.ObjectId, ref: "UserMoreInfo" }, 
  offerLetter: { type: mongoose.Schema.Types.ObjectId, ref: "OfferLetter" }, 
  department: { type: String },
  position: { type: String },  // Employee ID for current employees/interns
  employeeId: { 
    type: String, 
    unique: true, 
    sparse: true // Only required for employees, allows null values 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
