const db = require('../config/database');

/**
 * Create an emergency alert
 * POST /api/emergency
 */
exports.createEmergencyAlert = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { alertType, message, locationLat, locationLng } = req.body;

    if (!alertType) {
      return res.status(400).json({
        success: false,
        message: 'Alert type is required'
      });
    }

    // Get traveler ID
    const [travelers] = await db.query(
      'SELECT travelerId FROM travelers WHERE userId = ?',
      [userId]
    );

    if (travelers.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only travelers can create emergency alerts'
      });
    }

    const travelerId = travelers[0].travelerId;

    const [result] = await db.query(
      `INSERT INTO emergency_alerts
      (travelerId, alertType, message, locationLat, locationLng)
      VALUES (?, ?, ?, ?, ?)`,
      [travelerId, alertType, message, locationLat, locationLng]
    );

    res.status(201).json({
      success: true,
      message: 'Emergency alert created successfully',
      data: {
        alertId: result.insertId
      }
    });
  } catch (error) {
    console.error('Create emergency alert error:', error);
    next(error);
  }
};

/**
 * Get my emergency alerts
 * GET /api/emergency/my-alerts
 */
exports.getMyAlerts = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    // Get traveler ID
    const [travelers] = await db.query(
      'SELECT travelerId FROM travelers WHERE userId = ?',
      [userId]
    );

    if (travelers.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only travelers can view alerts'
      });
    }

    const travelerId = travelers[0].travelerId;

    let query = `
      SELECT
        alertId,
        alertType,
        message,
        locationLat,
        locationLng,
        status,
        resolvedAt,
        createdAt
      FROM emergency_alerts
      WHERE travelerId = ?
    `;

    const params = [travelerId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY createdAt DESC';

    const [alerts] = await db.query(query, params);

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Get my alerts error:', error);
    next(error);
  }
};

/**
 * Get alert by ID
 * GET /api/emergency/:alertId
 */
exports.getAlertById = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { alertId } = req.params;

    const [alerts] = await db.query(
      `SELECT
        ea.alertId,
        ea.travelerId,
        ea.alertType,
        ea.message,
        ea.locationLat,
        ea.locationLng,
        ea.status,
        ea.resolvedAt,
        ea.createdAt,
        u.firstName,
        u.lastName,
        u.email,
        u.contactNo,
        t.emergencyContact,
        t.emergencyContactName
      FROM emergency_alerts ea
      JOIN travelers t ON ea.travelerId = t.travelerId
      JOIN users u ON t.userId = u.userId
      WHERE ea.alertId = ?`,
      [alertId]
    );

    if (alerts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    const alert = alerts[0];

    // Check authorization (only owner can view)
    const [travelers] = await db.query(
      'SELECT travelerId FROM travelers WHERE travelerId = ? AND userId = ?',
      [alert.travelerId, userId]
    );

    if (travelers.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this alert'
      });
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error('Get alert by ID error:', error);
    next(error);
  }
};

/**
 * Update alert status
 * PATCH /api/emergency/:alertId/status
 */
exports.updateAlertStatus = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { alertId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['active', 'resolved', 'false_alarm'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Get traveler ID
    const [travelers] = await db.query(
      'SELECT travelerId FROM travelers WHERE userId = ?',
      [userId]
    );

    if (travelers.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only travelers can update alerts'
      });
    }

    const travelerId = travelers[0].travelerId;

    // Check ownership
    const [alerts] = await db.query(
      'SELECT alertId FROM emergency_alerts WHERE alertId = ? AND travelerId = ?',
      [alertId, travelerId]
    );

    if (alerts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found or unauthorized'
      });
    }

    const resolvedAt = (status === 'resolved' || status === 'false_alarm') ? new Date() : null;

    await db.query(
      'UPDATE emergency_alerts SET status = ?, resolvedAt = ? WHERE alertId = ?',
      [status, resolvedAt, alertId]
    );

    res.json({
      success: true,
      message: 'Alert status updated successfully'
    });
  } catch (error) {
    console.error('Update alert status error:', error);
    next(error);
  }
};

/**
 * Delete an alert
 * DELETE /api/emergency/:alertId
 */
exports.deleteAlert = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { alertId } = req.params;

    // Get traveler ID
    const [travelers] = await db.query(
      'SELECT travelerId FROM travelers WHERE userId = ?',
      [userId]
    );

    if (travelers.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only travelers can delete alerts'
      });
    }

    const travelerId = travelers[0].travelerId;

    // Check ownership
    const [alerts] = await db.query(
      'SELECT alertId FROM emergency_alerts WHERE alertId = ? AND travelerId = ?',
      [alertId, travelerId]
    );

    if (alerts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found or unauthorized'
      });
    }

    await db.query('DELETE FROM emergency_alerts WHERE alertId = ?', [alertId]);

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Delete alert error:', error);
    next(error);
  }
};

/**
 * Get active emergency alerts (for admin/monitoring)
 * GET /api/emergency/active-alerts
 */
exports.getActiveAlerts = async (req, res, next) => {
  try {
    const [alerts] = await db.query(
      `SELECT
        ea.alertId,
        ea.alertType,
        ea.message,
        ea.locationLat,
        ea.locationLng,
        ea.createdAt,
        u.firstName,
        u.lastName,
        u.email,
        u.contactNo,
        t.emergencyContact,
        t.emergencyContactName
      FROM emergency_alerts ea
      JOIN travelers t ON ea.travelerId = t.travelerId
      JOIN users u ON t.userId = u.userId
      WHERE ea.status = 'active'
      ORDER BY ea.createdAt DESC`
    );

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Get active alerts error:', error);
    next(error);
  }
};
