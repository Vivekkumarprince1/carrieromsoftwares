const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  recipientEmail: { type: String },
  domain: { type: String, required: true },
  jobrole: { type: String, required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  issuedBy: { type: String, default: "OM Softwares" },
  issuedOn: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Certificate", certificateSchema);
