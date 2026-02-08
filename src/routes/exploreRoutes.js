const express = require('express');
const router = express.Router();
const exploreController = require('../controllers/exploreController');
const { authenticateUser } = require('../middleware/authMiddleware');

/**
 * GET /api/explore/nearby-providers
 * Get service providers near user location
 * Query params:
 *   - latitude (required): User's current latitude
 *   - longitude (required): User's current longitude
 *   - radius (optional): Search radius in km (default: 10)
 *   - category (optional): Filter by provider type (hotel, guide, taxi, restaurant, other)
 */
router.get('/nearby-providers', authenticateUser, exploreController.getNearbyProviders);

/**
 * GET /api/explore/nearby-locations
 * Get tourist locations near user location
 * Query params:
 *   - latitude (required): User's current latitude
 *   - longitude (required): User's current longitude
 *   - radius (optional): Search radius in km (default: 10)
 *   - category (optional): Filter by location category
 */
router.get('/nearby-locations', authenticateUser, exploreController.getNearbyLocations);

/**
 * GET /api/explore/search
 * Search for locations and providers
 * Query params:
 *   - query (required): Search term (min 2 characters)
 *   - type (optional): 'location' or 'provider' (default: both)
 *   - latitude (optional): User's latitude for distance calculation
 *   - longitude (optional): User's longitude for distance calculation
 */
router.get('/search', authenticateUser, exploreController.search);

/**
 * POST /api/explore/sos
 * Send emergency SOS alert
 * Body:
 *   - latitude (required): Current latitude
 *   - longitude (required): Current longitude
 *   - message (optional): Emergency message
 *   - alertType (optional): 'sos' | 'medical' | 'police' | 'other' (default: 'sos')
 */
router.post('/sos', authenticateUser, exploreController.sendSOS);

/**
 * GET /api/explore/provider-categories
 * Get available provider categories
 */
router.get('/provider-categories', authenticateUser, exploreController.getProviderCategories);

/**
 * GET /api/explore/location-categories
 * Get available location categories
 */
router.get('/location-categories', authenticateUser, exploreController.getLocationCategories);

module.exports = router;
