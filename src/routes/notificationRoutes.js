const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateUser } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateUser);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch('/read-all', notificationController.markAllAsRead);

/**
 * @route   DELETE /api/notifications/delete-all
 * @desc    Delete all notifications
 * @access  Private
 */
router.delete('/delete-all', notificationController.deleteAllNotifications);

/**
 * @route   GET /api/notifications
 * @desc    Get my notifications
 * @access  Private
 */
router.get('/', notificationController.getMyNotifications);

/**
 * @route   POST /api/notifications
 * @desc    Create a notification (system use)
 * @access  Private
 */
router.post('/', notificationController.createNotification);

/**
 * @route   PATCH /api/notifications/:notificationId/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch('/:notificationId/read', notificationController.markAsRead);

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
