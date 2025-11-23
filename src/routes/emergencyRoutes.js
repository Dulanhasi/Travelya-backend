const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');
const { authenticateUser } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateUser);

/**
 * @route   POST /api/emergency
 * @desc    Create an emergency alert
 * @access  Private (Traveler)
 */
router.post('/', emergencyController.createEmergencyAlert);

/**
 * @route   GET /api/emergency/my-alerts
 * @desc    Get my emergency alerts
 * @access  Private (Traveler)
 */
router.get('/my-alerts', emergencyController.getMyAlerts);

/**
 * @route   GET /api/emergency/active-alerts
 * @desc    Get active emergency alerts (for admin/monitoring)
 * @access  Private
 */
router.get('/active-alerts', emergencyController.getActiveAlerts);

/**
 * @route   GET /api/emergency/:alertId
 * @desc    Get alert by ID
 * @access  Private (Traveler)
 */
router.get('/:alertId', emergencyController.getAlertById);

/**
 * @route   PATCH /api/emergency/:alertId/status
 * @desc    Update alert status
 * @access  Private (Traveler)
 */
router.patch('/:alertId/status', emergencyController.updateAlertStatus);

/**
 * @route   DELETE /api/emergency/:alertId
 * @desc    Delete an alert
 * @access  Private (Traveler)
 */
router.delete('/:alertId', emergencyController.deleteAlert);

module.exports = router;
