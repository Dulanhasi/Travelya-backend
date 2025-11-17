const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user after Firebase authentication
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   GET /api/auth/check/:firebaseUid
 * @desc    Check if user exists in database
 * @access  Public
 */
router.get('/check/:firebaseUid', authController.checkUser);

// Protected routes (require authentication)
router.use(authenticateUser);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authController.getProfile);

/**
 * @route   PATCH /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.patch('/profile', authController.updateProfile);

/**
 * @route   PATCH /api/auth/traveler-info
 * @desc    Update traveler specific information
 * @access  Private (Traveler only)
 */
router.patch('/traveler-info', authController.updateTravelerInfo);

/**
 * @route   DELETE /api/auth/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', authController.deleteAccount);

module.exports = router;
