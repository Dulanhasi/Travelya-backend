const express = require('express');
const router = express.Router();
const serviceProviderController = require('../controllers/serviceProviderController');
const { authenticateUser } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/service-providers/nearby
 * @desc    Get nearby service providers
 * @access  Public
 */
router.get('/nearby', serviceProviderController.getNearbyProviders);

/**
 * @route   GET /api/service-providers/type/:providerType
 * @desc    Get providers by type
 * @access  Public
 */
router.get('/type/:providerType', serviceProviderController.getProvidersByType);

/**
 * @route   GET /api/service-providers/my-profile
 * @desc    Get my provider profile
 * @access  Private (Service Provider)
 */
router.get('/my-profile', authenticateUser, serviceProviderController.getMyProviderProfile);

/**
 * @route   GET /api/service-providers/:providerId/packages
 * @desc    Get packages for a provider
 * @access  Public
 */
router.get('/:providerId/packages', serviceProviderController.getProviderPackages);

/**
 * @route   GET /api/service-providers/:providerId
 * @desc    Get service provider by ID
 * @access  Public
 */
router.get('/:providerId', serviceProviderController.getProviderById);

/**
 * @route   GET /api/service-providers
 * @desc    Get all service providers
 * @access  Public
 */
router.get('/', serviceProviderController.getAllProviders);

// Protected routes (require authentication)
router.use(authenticateUser);

/**
 * @route   PATCH /api/service-providers/profile
 * @desc    Update provider profile
 * @access  Private (Service Provider)
 */
router.patch('/profile', serviceProviderController.updateProviderProfile);

/**
 * @route   POST /api/service-providers/packages
 * @desc    Create a service package
 * @access  Private (Service Provider)
 */
router.post('/packages', serviceProviderController.createPackage);

/**
 * @route   PATCH /api/service-providers/packages/:packageId
 * @desc    Update a service package
 * @access  Private (Service Provider)
 */
router.patch('/packages/:packageId', serviceProviderController.updatePackage);

/**
 * @route   DELETE /api/service-providers/packages/:packageId
 * @desc    Delete a service package
 * @access  Private (Service Provider)
 */
router.delete('/packages/:packageId', serviceProviderController.deletePackage);

module.exports = router;
