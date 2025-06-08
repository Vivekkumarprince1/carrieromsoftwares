const express = require('express');
const router = express.Router();
const { auth, verifyAdmin, verifyReviewEligibility } = require('../middleware/authMiddleware');
const {
    submitReview,
    getApprovedReviews,
    getPendingReviews,
    getAllReviews,
    approveReview,
    rejectReview,
    getUserReview,
    checkReviewEligibility,
    updateReview
} = require('../Controllers/reviewController');

// Public routes
router.get('/approved', getApprovedReviews); // Get all approved reviews (public)

// Protected routes for eligible users (employees/offer recipients)
router.get('/eligibility', verifyReviewEligibility, checkReviewEligibility); // Check if user can submit review
router.get('/my-review', verifyReviewEligibility, getUserReview); // Get user's own review
router.post('/submit', verifyReviewEligibility, submitReview); // Submit new review

// Admin only routes
router.get('/pending', verifyAdmin, getPendingReviews); // Get pending reviews
router.get('/all', verifyAdmin, getAllReviews); // Get all reviews with filtering
router.put('/:reviewId/approve', verifyAdmin, approveReview); // Approve review
router.put('/:reviewId/reject', verifyAdmin, rejectReview); // Reject review
router.put('/:reviewId/update', verifyAdmin, updateReview); // Update review

module.exports = router;
