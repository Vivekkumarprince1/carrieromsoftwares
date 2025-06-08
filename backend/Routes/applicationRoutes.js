const express = require("express");
const router = express.Router();
const applicationController = require("../Controllers/applicationController");
const { verifyAdmin, auth } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

// Configure multer for resume uploads (memory storage for Cloudinary)
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
    }
  }
});

// More flexible file filter for question answers (allows more file types)
const questionFileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx|jpg|jpeg|png|gif|mp3|mp4|txt/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error("Unsupported file type for question answer"));
    }
  }
});

// Public route to submit application
router.post("/submit", resumeUpload.single("resume"), applicationController.submitApplication);

// User routes
router.post("/", auth, resumeUpload.single("resume"), applicationController.createApplication);
router.post("/parse-resume", auth, resumeUpload.single("resume"), applicationController.parseResume);
router.get("/my", auth, applicationController.getMyApplications);
router.get("/for-recommendation", auth, applicationController.getApplicationsForRecommendation);

// New routes for question handling
router.post("/upload-question-file", auth, questionFileUpload.single("file"), applicationController.uploadQuestionFile);
router.put("/:applicationId/answers", auth, applicationController.updateApplicationAnswers);

// Admin routes
router.get("/", auth, verifyAdmin, applicationController.getAllApplications);
router.get("/job/:jobId", auth, verifyAdmin, applicationController.getJobApplications);
router.get("/:id/detail", auth, verifyAdmin, applicationController.getApplicationDetail);
router.put("/:id/status", auth, verifyAdmin, applicationController.updateApplicationStatus);
router.post("/:applicationId/offer", auth, verifyAdmin, applicationController.generateOfferLetter);
router.post("/:applicationId/reject", auth, verifyAdmin, applicationController.rejectApplication);
router.post("/:applicationId/welcome", auth, verifyAdmin, applicationController.sendWelcomeEmail);



module.exports = router;