const mongoose = require("mongoose");

const offerLetterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  candidateName: { type: String, required: true },
  email: { type: String, required: true },
  position: { type: String, required: true },
  department: { type: String, required: true },
  salary: { type: Number, required: true },
  startDate: { type: Date, required: true },
  joiningLocation: { type: String, required: true },
  workType: { type: String, enum: ['Remote', 'On-site', 'Hybrid'], default: 'On-site' },
  benefits: [{ type: String }],
  reportingManager: { type: String },
  companyName: { type: String, default: "OM Softwares" },
  hrContactName: { type: String },
  hrContactEmail: { type: String },
  hrContactPhone: { type: String },
  issuedBy: { type: String, default: "OM Softwares" },
  issuedOn: { type: Date, default: Date.now },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
  validUntil: { type: Date, required: true },
  additionalNotes: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model("OfferLetter", offerLetterSchema);