const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateUser, checkRole } = require('../middleware/authMiddleware');

// All routes require authentication and admin role
router.use(authenticateUser);
router.use(checkRole(['admin']));

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Private (Admin only)
 */
router.get('/stats', adminController.getDashboardStats);

/**
 * @route   GET /api/admin/pending-providers
 * @desc    Get pending service providers
 * @access  Private (Admin only)
 */
router.get('/pending-providers', adminController.getPendingProviders);

/**
 * @route   POST /api/admin/approve-provider/:userId
 * @desc    Approve service provider
 * @access  Private (Admin only)
 */
router.post('/approve-provider/:userId', adminController.approveProvider);

/**
 * @route   POST /api/admin/reject-provider/:userId
 * @desc    Reject service provider
 * @access  Private (Admin only)
 */
router.post('/reject-provider/:userId', adminController.rejectProvider);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get('/users', adminController.getAllUsers);

/**
 * @route   PUT /api/admin/user-status/:userId
 * @desc    Toggle user active/inactive status
 * @access  Private (Admin only)
 */
router.put('/user-status/:userId', adminController.toggleUserStatus);

/**
 * @route   GET /api/admin/pending-locations
 * @desc    Get pending locations
 * @access  Private (Admin only)
 */
router.get('/pending-locations', adminController.getPendingLocations);

/**
 * @route   POST /api/admin/approve-location/:locationId
 * @desc    Approve location
 * @access  Private (Admin only)
 */
router.post('/approve-location/:locationId', adminController.approveLocation);

/**
 * @route   POST /api/admin/reject-location/:locationId
 * @desc    Reject location
 * @access  Private (Admin only)
 */
router.post('/reject-location/:locationId', adminController.rejectLocation);

/**
 * @route   GET /api/admin/approved-locations
 * @desc    Get approved locations
 * @access  Private (Admin only)
 */
router.get('/approved-locations', adminController.getApprovedLocations);

/**
 * @route   GET /api/admin/rejected-locations
 * @desc    Get rejected locations
 * @access  Private (Admin only)
 */
router.get('/rejected-locations', adminController.getRejectedLocations);

module.exports = router;
