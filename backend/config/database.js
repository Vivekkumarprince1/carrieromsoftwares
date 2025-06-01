const mongoose = require("mongoose");
require("dotenv").config();

// Database connection function
const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");
    console.log(`URI: ${process.env.MONGO_URI.substring(0, 10)}...`); // Show partial URI for security
    
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected: ${connection.connection.host}`);
    console.log(`DB: ${connection.connection.name}`);
    return connection;
  } catch (error) {
    console.error("Connection error:", error);
    process.exit(1); // Exit with failure
  }
};

module.exports = connectDB;