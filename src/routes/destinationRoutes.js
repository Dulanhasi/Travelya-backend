const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');
const { authenticateUser } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/destinations/popular
 * @desc    Get popular destinations
 * @access  Public
 */
router.get('/popular', destinationController.getPopularDestinations);

/**
 * @route   GET /api/destinations/nearby
 * @desc    Get nearby destinations based on coordinates
 * @access  Public
 */
router.get('/nearby', destinationController.getNearbyDestinations);

/**
 * @route   GET /api/destinations/category/:category
 * @desc    Get destinations by category
 * @access  Public
 */
router.get('/category/:category', destinationController.getDestinationsByCategory);

/**
 * @route   GET /api/destinations/:locationId
 * @desc    Get destination by ID
 * @access  Public
 */
router.get('/:locationId', destinationController.getDestinationById);

/**
 * @route   GET /api/destinations
 * @desc    Get all destinations with optional filters
 * @access  Public
 */
router.get('/', destinationController.getAllDestinations);

/**
 * @route   POST /api/destinations/suggest
 * @desc    Suggest a new destination
 * @access  Private
 */
router.post('/suggest', authenticateUser, destinationController.suggestDestination);

module.exports = router;
