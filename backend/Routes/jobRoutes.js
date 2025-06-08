const express = require("express");
const router = express.Router();
const jobController = require("../Controllers/jobController");
const { verifyAdmin, auth } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const { uploadImage, deleteImage, extractPublicId } = require('../config/cloudinary');


// Configure multer for job image uploads (memory storage for Cloudinary)
const jobImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB file size limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Public routes
router.get("/featured", jobController.getFeaturedJobs); // Add this route for featured jobs
router.get("/search", jobController.searchJobs);
router.get("/filter", jobController.filterJobs);
router.get("/sort", jobController.sortJobs);
router.get("/", jobController.getJobs);
router.get("/:id", jobController.getJobById);
router.get("/:jobId/questions", jobController.getJobQuestions);

// Admin routes
router.post("/", auth, verifyAdmin, jobImageUpload.single('image'), jobController.createJob);
router.put("/:id", auth, verifyAdmin, jobImageUpload.single('image'), jobController.updateJob);
router.delete("/:id", auth, verifyAdmin, jobController.deleteJob);

// Admin routes for question management
router.post("/:jobId/questions", auth, verifyAdmin, jobController.addJobQuestion);
router.put("/:jobId/questions/:questionId", auth, verifyAdmin, jobController.updateJobQuestion);
router.delete("/:jobId/questions/:questionId", auth, verifyAdmin, jobController.deleteJobQuestion);
router.put("/:jobId/questions-reorder", auth, verifyAdmin, jobController.reorderJobQuestions);

module.exports = router;