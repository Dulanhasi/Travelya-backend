const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { authenticateUser } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateUser);

/**
 * @route   POST /api/trips/generate
 * @desc    Generate AI-powered itinerary using n8n
 * @access  Private (Traveler)
 */
router.post('/generate', tripController.generateItinerary);

/**
 * @route   POST /api/trips/save
 * @desc    Save trip plan to database
 * @access  Private (Traveler)
 */
router.post('/save', tripController.saveTrip);

/**
 * @route   GET /api/trips
 * @desc    Get all trips for logged-in user
 * @access  Private (Traveler)
 */
router.get('/', tripController.getUserTrips);

/**
 * @route   GET /api/trips/:tripId
 * @desc    Get trip details by ID
 * @access  Private (Traveler)
 */
router.get('/:tripId', tripController.getTripById);

/**
 * @route   PATCH /api/trips/:tripId/status
 * @desc    Update trip status
 * @access  Private (Traveler)
 */
router.patch('/:tripId/status', tripController.updateTripStatus);

/**
 * @route   DELETE /api/trips/:tripId
 * @desc    Delete trip
 * @access  Private (Traveler)
 */
router.delete('/:tripId', tripController.deleteTrip);

module.exports = router;
