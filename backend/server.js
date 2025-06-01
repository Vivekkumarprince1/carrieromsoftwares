const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const connectDB = require("./config/database");
const { validateConfig, authConfig } = require("./config/authConfig");
const authRoutes = require("./Routes/authRoute");
const certificationRoutes = require("./Routes/CertificationRoute");
const jobRoutes = require("./Routes/jobRoutes");
const applicationRoutes = require("./Routes/applicationRoutes");

console.log("Starting API server...");

validateConfig();

const fs = require("fs");
const { ok } = require("assert");
const uploadDirs = [
  "./uploads",
  "./uploads/resumes",
  "./uploads/certificates",
  "./uploads/offers"
];

console.log("Creating upload dirs...");
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created: ${dir}`);
  } else {
    console.log(`Exists: ${dir}`);
  }
});

const app = express();
console.log("Init Express app");

// Configure CORS to allow all origins
const corsOptions = {
  origin: true,  // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
console.log("CORS enabled with options");
app.use(express.json());
console.log("JSON parser enabled");

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
console.log("Static serving: /uploads");


app.get("/", (req, res) => {
  console.log("Root accessed");
  res.send("Welcome to the OM Software API!");
});
app.get("/api", (req, res) => {
  res.status(200).json({ message: "Welcome to the OM Software API!" });
});
app.use("/api/auth", authRoutes);
app.use("/api/certification", certificationRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);


const PORT = authConfig.port;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running: http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error("Start failed:", err);
  });