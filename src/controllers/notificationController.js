const db = require('../config/database');

/**
 * Get my notifications
 * GET /api/notifications
 */
exports.getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { isRead, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        notificationId,
        title,
        message,
        type,
        isRead,
        relatedEntityType,
        relatedEntityId,
        createdAt
      FROM notifications
      WHERE userId = ?
    `;

    const params = [userId];

    if (isRead !== undefined) {
      query += ' AND isRead = ?';
      params.push(isRead === 'true' ? 1 : 0);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [notifications] = await db.query(query, params);

    res.json({
      success: true,
      data: notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Get my notifications error:', error);
    next(error);
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const [result] = await db.query(
      'SELECT COUNT(*) as unreadCount FROM notifications WHERE userId = ? AND isRead = FALSE',
      [userId]
    );

    res.json({
      success: true,
      data: {
        unreadCount: result[0].unreadCount
      }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    next(error);
  }
};

/**
 * Mark notification as read
 * PATCH /api/notifications/:notificationId/read
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    // Check ownership
    const [notifications] = await db.query(
      'SELECT notificationId FROM notifications WHERE notificationId = ? AND userId = ?',
      [notificationId, userId]
    );

    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized'
      });
    }

    await db.query(
      'UPDATE notifications SET isRead = TRUE WHERE notificationId = ?',
      [notificationId]
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    next(error);
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    await db.query(
      'UPDATE notifications SET isRead = TRUE WHERE userId = ? AND isRead = FALSE',
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    next(error);
  }
};

/**
 * Delete a notification
 * DELETE /api/notifications/:notificationId
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { notificationId } = req.params;

    // Check ownership
    const [notifications] = await db.query(
      'SELECT notificationId FROM notifications WHERE notificationId = ? AND userId = ?',
      [notificationId, userId]
    );

    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized'
      });
    }

    await db.query('DELETE FROM notifications WHERE notificationId = ?', [notificationId]);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    next(error);
  }
};

/**
 * Delete all notifications
 * DELETE /api/notifications/delete-all
 */
exports.deleteAllNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    await db.query('DELETE FROM notifications WHERE userId = ?', [userId]);

    res.json({
      success: true,
      message: 'All notifications deleted successfully'
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    next(error);
  }
};

/**
 * Create a notification (system use)
 * POST /api/notifications
 */
exports.createNotification = async (req, res, next) => {
  try {
    const { userId, title, message, type, relatedEntityType, relatedEntityId } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'User ID, title, and message are required'
      });
    }

    const [result] = await db.query(
      `INSERT INTO notifications
      (userId, title, message, type, relatedEntityType, relatedEntityId)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, title, message, type || 'info', relatedEntityType, relatedEntityId]
    );

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: {
        notificationId: result.insertId
      }
    });
  } catch (error) {
    console.error('Create notification error:', error);
    next(error);
  }
};
