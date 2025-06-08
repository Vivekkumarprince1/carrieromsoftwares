const express = require("express");
const router = express.Router();
const {
  createRecommendation,
  getMyRecommendations,
  getAllRecommendations,
  updateRecommendationStatus,
  deleteRecommendation,
  getRecommendationStats,
  linkExistingApplications
} = require("../Controllers/recommendationController");
const { authenticateToken, isAdmin, isEmployeeOnly } = require("../middleware/authMiddleware");

// Employee routes (requires authentication and employee status only - no interns)
router.post("/", authenticateToken, isEmployeeOnly, createRecommendation);
router.get("/my-recommendations", authenticateToken, isEmployeeOnly, getMyRecommendations);
router.delete("/:id", authenticateToken, isEmployeeOnly, deleteRecommendation);

// Admin routes (requires authentication and admin role)
router.get("/all", authenticateToken, isAdmin, getAllRecommendations);
router.put("/:id/status", authenticateToken, isAdmin, updateRecommendationStatus);
router.get("/stats", authenticateToken, isAdmin, getRecommendationStats);
router.post("/link-applications", authenticateToken, isAdmin, linkExistingApplications);

module.exports = router;
