const express = require("express");
const router = express.Router();
const CertificationController = require("../Controllers/CertificateController");
const OfferLetterController = require("../Controllers/OfferLetterController");
const {verifyAdmin} = require("../middleware/authMiddleware")
const {auth} = require("../middleware/authMiddleware")

// Certificate routes
router.post("/issue", auth, verifyAdmin, CertificationController.issue);
router.get("/verify/:id", CertificationController.verifyCertificate);
router.get("/", auth, verifyAdmin, CertificationController.getAllCertificates);
router.get("/download/:id", CertificationController.downloadCertificate);
router.post("/:id/send-email", auth, verifyAdmin, CertificationController.sendCertificateEmail);

// Offer Letter routes (keeping the existing issue-offer route and adding new ones)
router.post("/issue-offer", auth, verifyAdmin, OfferLetterController.issueOfferLetter);
router.get("/offer-letters", auth, verifyAdmin, OfferLetterController.getAllOfferLetters);
router.get("/offer-letters/:id", auth, verifyAdmin, OfferLetterController.getOfferLetterById);
router.patch("/offer-letters/:id/status", auth,verifyAdmin, OfferLetterController.updateOfferLetterStatus);
router.patch("/offer-letters/:id/extend", auth, verifyAdmin, OfferLetterController.extendOfferLetter);
router.get("/offer-letters/:id/download", auth, OfferLetterController.downloadOfferLetter);
router.post("/offer-letters/:id/send-email", auth, verifyAdmin, OfferLetterController.sendOfferLetterEmail);
router.post("/offer-letters/:id/regenerate-token", auth, verifyAdmin, OfferLetterController.regenerateAcceptanceToken);
router.post("/offer-letters/add-tokens", auth, verifyAdmin, OfferLetterController.addAcceptanceTokensToExisting);

module.exports = router;
