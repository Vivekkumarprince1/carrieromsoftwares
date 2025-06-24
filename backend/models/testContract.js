const mongoose = require("mongoose");

const testSchema = new mongoose.Schema({
  name: { type: String, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model("TestContract", testSchema);
