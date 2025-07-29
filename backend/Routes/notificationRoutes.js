const express = require("express");
const router = express.Router();
const { auth, isAdmin } = require("../middleware/authMiddleware");
const notificationController = require("../Controllers/notificationController");

// User routes (require authentication)
router.get("/", auth, notificationController.getUserNotifications);
router.get("/count", auth, notificationController.getUnreadNotificationCount);
router.patch("/:notificationId/read", auth, notificationController.markNotificationAsRead);
router.patch("/mark-all-read", auth, notificationController.markAllNotificationsAsRead);
router.delete("/:notificationId", auth, notificationController.deleteNotification);

// Admin routes (require admin authentication)
router.get("/admin/all", auth, isAdmin, notificationController.getAllNotifications);

module.exports = router;
