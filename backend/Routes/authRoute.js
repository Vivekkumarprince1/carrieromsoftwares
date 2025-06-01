const express = require("express");
const router = express.Router();
const authController = require("../Controllers/authController");
const { verifyAdmin, auth } = require("../middleware/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/users", auth, verifyAdmin, authController.getAllUsers);
router.get("/logout", auth,(req, res) => {
    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
  }
);

router.get('/admin-data', verifyAdmin, (req, res) => {
    res.json({
      message: 'Hello Admin!',
      data: {
        secretAdminInfo: 'This is some secret data only accessible to admins.'
      }
    });
  });

router.get('/user-data', auth, (req, res) => {
    res.json({
      message: 'Hello User!',
      userId: req.user.userId
    });
});

module.exports = router;