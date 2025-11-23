const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticateUser } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateUser);

/**
 * @route   POST /api/bookings
 * @desc    Create a service booking request
 * @access  Private (Traveler)
 */
router.post('/', bookingController.createBooking);

/**
 * @route   GET /api/bookings/my-bookings
 * @desc    Get my bookings (for travelers)
 * @access  Private (Traveler)
 */
router.get('/my-bookings', bookingController.getMyBookings);

/**
 * @route   GET /api/bookings/provider-requests
 * @desc    Get booking requests for provider
 * @access  Private (Service Provider)
 */
router.get('/provider-requests', bookingController.getProviderRequests);

/**
 * @route   GET /api/bookings/:requestId
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:requestId', bookingController.getBookingById);

/**
 * @route   PATCH /api/bookings/:requestId/status
 * @desc    Update booking status (for provider)
 * @access  Private (Service Provider)
 */
router.patch('/:requestId/status', bookingController.updateBookingStatus);

/**
 * @route   PATCH /api/bookings/:requestId/cancel
 * @desc    Cancel booking (for traveler)
 * @access  Private (Traveler)
 */
router.patch('/:requestId/cancel', bookingController.cancelBooking);

/**
 * @route   PATCH /api/bookings/:requestId/payment
 * @desc    Update payment status
 * @access  Private (Traveler)
 */
router.patch('/:requestId/payment', bookingController.updatePaymentStatus);

module.exports = router;
