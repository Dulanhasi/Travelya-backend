const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateUser } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/reviews/stats/:reviewType/:targetId
 * @desc    Get review statistics for a target
 * @access  Public
 */
router.get('/stats/:reviewType/:targetId', reviewController.getReviewStats);

/**
 * @route   GET /api/reviews/:reviewType/:targetId
 * @desc    Get reviews for a target (location or service provider)
 * @access  Public
 */
router.get('/:reviewType/:targetId', reviewController.getReviewsByTarget);

// Protected routes (require authentication)
router.use(authenticateUser);

/**
 * @route   GET /api/reviews/my-reviews
 * @desc    Get my reviews
 * @access  Private
 */
router.get('/my-reviews', reviewController.getMyReviews);

/**
 * @route   POST /api/reviews
 * @desc    Create a review
 * @access  Private
 */
router.post('/', reviewController.createReview);

/**
 * @route   PATCH /api/reviews/:reviewId
 * @desc    Update a review
 * @access  Private
 */
router.patch('/:reviewId', reviewController.updateReview);

/**
 * @route   DELETE /api/reviews/:reviewId
 * @desc    Delete a review
 * @access  Private
 */
router.delete('/:reviewId', reviewController.deleteReview);

module.exports = router;
