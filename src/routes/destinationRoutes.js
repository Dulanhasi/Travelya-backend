// const express = require('express');
// const router = express.Router();
// const destinationController = require('../controllers/destinationController');
// const { authenticateUser } = require('../middleware/authMiddleware');

// /**
//  * @route   GET /api/destinations/popular
//  * @desc    Get popular destinations
//  * @access  Public
//  */
// router.get('/popular', destinationController.getPopularDestinations);

// /**
//  * @route   GET /api/destinations/nearby
//  * @desc    Get nearby destinations based on coordinates
//  * @access  Public
//  */
// router.get('/nearby', destinationController.getNearbyDestinations);

// /**
//  * @route   GET /api/destinations/my-submissions
//  * @desc    Get my submitted destinations (pending, approved, rejected)
//  * @access  Private
//  */
// router.get('/my-submissions', authenticateUser, destinationController.getMySubmissions);

// /**
//  * @route   GET /api/destinations/category/:category
//  * @desc    Get destinations by category
//  * @access  Public
//  */
// router.get('/category/:category', destinationController.getDestinationsByCategory);

// /**
//  * @route   GET /api/destinations/:locationId
//  * @desc    Get destination by ID
//  * @access  Public
//  */
// router.get('/:locationId', destinationController.getDestinationById);

// /**
//  * @route   GET /api/destinations
//  * @desc    Get all destinations with optional filters
//  * @access  Public
//  */
// router.get('/', destinationController.getAllDestinations);

// /**
//  * @route   POST /api/destinations/suggest
//  * @desc    Suggest a new destination
//  * @access  Private
//  */
// router.post('/suggest', authenticateUser, destinationController.suggestDestination);

// /**
//  * @route   PUT /api/destinations/:locationId
//  * @desc    Update own pending destination
//  * @access  Private
//  */
// router.put('/:locationId', authenticateUser, destinationController.updateMyDestination);

// /**
//  * @route   DELETE /api/destinations/:locationId
//  * @desc    Delete own pending destination
//  * @access  Private
//  */
// router.delete('/:locationId', authenticateUser, destinationController.deleteMyDestination);

// module.exports = router;


// routes/destinationRoutes.js
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
 * @route   GET /api/destinations/my-submissions
 * @desc    Get my submitted destinations (pending, approved, rejected)
 * @access  Private
 */
router.get('/my-submissions', authenticateUser, destinationController.getMySubmissions);

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
 * @route   POST /api/destinations
 * @desc    Create a new destination (admin or user - admin auto-approve)
 * @access  Private
 */
router.post('/', authenticateUser, destinationController.createDestination);

/**
 * @route   POST /api/destinations/suggest
 * @desc    Suggest a new destination
 * @access  Private
 */
router.post('/suggest', authenticateUser, destinationController.suggestDestination);

/**
 * @route   PUT /api/destinations/:locationId
 * @desc    Update own pending destination
 * @access  Private
 */
router.put('/:locationId', authenticateUser, destinationController.updateMyDestination);

/**
 * @route   DELETE /api/destinations/:locationId
 * @desc    Delete own pending destination
 * @access  Private
 */
router.delete('/:locationId', authenticateUser, destinationController.deleteMyDestination);

module.exports = router;
