const express = require("express");
const router = express.Router();
const contractController = require("../Controllers/contractController");
const { verifyAdmin, auth } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

// Configure multer for document uploads
const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx|jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, DOCX, JPG, JPEG, PNG files are allowed"));
    }
  }
});

// Public routes for offer acceptance (no auth required)
router.get("/offer/accept/:token", contractController.getOfferForAcceptance);
router.post("/offer/accept/:token", contractController.acceptOffer);
router.post("/offer/reject/:token", contractController.rejectOffer);

// Document upload route (can be used during acceptance process)
router.post("/:contractId/upload", documentUpload.single("document"), contractController.uploadContractDocument);

// Admin routes for contract management
router.get("/", auth, verifyAdmin, contractController.getAllContracts);
router.get("/application/:applicationId", auth, verifyAdmin, contractController.getContractByApplicationId);
router.get("/:contractId", auth, verifyAdmin, contractController.getContractById);
router.put("/:contractId/status", auth, verifyAdmin, contractController.updateContractStatus);
router.get("/:contractId/pdf", auth, verifyAdmin, contractController.generateContractPDF);

module.exports = router;
