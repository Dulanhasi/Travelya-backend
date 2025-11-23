const db = require('../config/database');

/**
 * Create a travel journal entry
 * POST /api/journals
 */
exports.createJournal = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { tripId, title, content, visitDate, locationId, images, isPublic } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
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
        message: 'Only travelers can create journal entries'
      });
    }

    const travelerId = travelers[0].travelerId;

    const [result] = await db.query(
      `INSERT INTO travel_journals
      (travelerId, tripId, title, content, visitDate, locationId, images, isPublic)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        travelerId,
        tripId,
        title,
        content,
        visitDate,
        locationId,
        JSON.stringify(images || []),
        isPublic || false
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Journal entry created successfully',
      data: {
        journalId: result.insertId
      }
    });
  } catch (error) {
    console.error('Create journal error:', error);
    next(error);
  }
};

/**
 * Get my journal entries
 * GET /api/journals/my-journals
 */
exports.getMyJournals = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { tripId } = req.query;

    // Get traveler ID
    const [travelers] = await db.query(
      'SELECT travelerId FROM travelers WHERE userId = ?',
      [userId]
    );

    if (travelers.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only travelers can view journals'
      });
    }

    const travelerId = travelers[0].travelerId;

    let query = `
      SELECT
        j.journalId,
        j.tripId,
        j.title,
        j.content,
        j.visitDate,
        j.locationId,
        j.images,
        j.isPublic,
        j.createdAt,
        j.updatedAt,
        l.name as locationName,
        t.tripName
      FROM travel_journals j
      LEFT JOIN locations l ON j.locationId = l.locationId
      LEFT JOIN trip_plans t ON j.tripId = t.tripId
      WHERE j.travelerId = ?
    `;

    const params = [travelerId];

    if (tripId) {
      query += ' AND j.tripId = ?';
      params.push(tripId);
    }

    query += ' ORDER BY j.createdAt DESC';

    const [journals] = await db.query(query, params);

    // Parse JSON fields
    journals.forEach(journal => {
      if (journal.images) journal.images = JSON.parse(journal.images);
    });

    res.json({
      success: true,
      data: journals,
      count: journals.length
    });
  } catch (error) {
    console.error('Get my journals error:', error);
    next(error);
  }
};

/**
 * Get public journal entries
 * GET /api/journals/public
 */
exports.getPublicJournals = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0, locationId } = req.query;

    let query = `
      SELECT
        j.journalId,
        j.title,
        j.content,
        j.visitDate,
        j.locationId,
        j.images,
        j.createdAt,
        l.name as locationName,
        u.firstName,
        u.lastName,
        u.profileImage
      FROM travel_journals j
      JOIN travelers t ON j.travelerId = t.travelerId
      JOIN users u ON t.userId = u.userId
      LEFT JOIN locations l ON j.locationId = l.locationId
      WHERE j.isPublic = TRUE
    `;

    const params = [];

    if (locationId) {
      query += ' AND j.locationId = ?';
      params.push(locationId);
    }

    query += ' ORDER BY j.createdAt DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [journals] = await db.query(query, params);

    // Parse JSON fields
    journals.forEach(journal => {
      if (journal.images) journal.images = JSON.parse(journal.images);
    });

    res.json({
      success: true,
      data: journals,
      count: journals.length
    });
  } catch (error) {
    console.error('Get public journals error:', error);
    next(error);
  }
};

/**
 * Get journal by ID
 * GET /api/journals/:journalId
 */
exports.getJournalById = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { journalId } = req.params;

    const [journals] = await db.query(
      `SELECT
        j.journalId,
        j.travelerId,
        j.tripId,
        j.title,
        j.content,
        j.visitDate,
        j.locationId,
        j.images,
        j.isPublic,
        j.createdAt,
        j.updatedAt,
        l.name as locationName,
        t.tripName,
        u.firstName,
        u.lastName,
        u.profileImage
      FROM travel_journals j
      JOIN travelers tr ON j.travelerId = tr.travelerId
      JOIN users u ON tr.userId = u.userId
      LEFT JOIN locations l ON j.locationId = l.locationId
      LEFT JOIN trip_plans t ON j.tripId = t.tripId
      WHERE j.journalId = ?`,
      [journalId]
    );

    if (journals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    const journal = journals[0];

    // Check authorization (only owner can view private journals)
    if (!journal.isPublic) {
      const [travelers] = await db.query(
        'SELECT travelerId FROM travelers WHERE travelerId = ? AND userId = ?',
        [journal.travelerId, userId]
      );

      if (travelers.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to view this journal entry'
        });
      }
    }

    // Parse JSON fields
    if (journal.images) journal.images = JSON.parse(journal.images);

    res.json({
      success: true,
      data: journal
    });
  } catch (error) {
    console.error('Get journal by ID error:', error);
    next(error);
  }
};

/**
 * Update a journal entry
 * PATCH /api/journals/:journalId
 */
exports.updateJournal = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { journalId } = req.params;
    const { title, content, visitDate, locationId, images, isPublic } = req.body;

    // Get traveler ID
    const [travelers] = await db.query(
      'SELECT travelerId FROM travelers WHERE userId = ?',
      [userId]
    );

    if (travelers.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only travelers can update journals'
      });
    }

    const travelerId = travelers[0].travelerId;

    // Check ownership
    const [journals] = await db.query(
      'SELECT journalId FROM travel_journals WHERE journalId = ? AND travelerId = ?',
      [journalId, travelerId]
    );

    if (journals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found or unauthorized'
      });
    }

    const updateFields = [];
    const params = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      params.push(title);
    }
    if (content !== undefined) {
      updateFields.push('content = ?');
      params.push(content);
    }
    if (visitDate !== undefined) {
      updateFields.push('visitDate = ?');
      params.push(visitDate);
    }
    if (locationId !== undefined) {
      updateFields.push('locationId = ?');
      params.push(locationId);
    }
    if (images !== undefined) {
      updateFields.push('images = ?');
      params.push(JSON.stringify(images));
    }
    if (isPublic !== undefined) {
      updateFields.push('isPublic = ?');
      params.push(isPublic);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(journalId);

    await db.query(
      `UPDATE travel_journals SET ${updateFields.join(', ')} WHERE journalId = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Journal entry updated successfully'
    });
  } catch (error) {
    console.error('Update journal error:', error);
    next(error);
  }
};

/**
 * Delete a journal entry
 * DELETE /api/journals/:journalId
 */
exports.deleteJournal = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { journalId } = req.params;

    // Get traveler ID
    const [travelers] = await db.query(
      'SELECT travelerId FROM travelers WHERE userId = ?',
      [userId]
    );

    if (travelers.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only travelers can delete journals'
      });
    }

    const travelerId = travelers[0].travelerId;

    // Check ownership
    const [journals] = await db.query(
      'SELECT journalId FROM travel_journals WHERE journalId = ? AND travelerId = ?',
      [journalId, travelerId]
    );

    if (journals.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found or unauthorized'
      });
    }

    await db.query('DELETE FROM travel_journals WHERE journalId = ?', [journalId]);

    res.json({
      success: true,
      message: 'Journal entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete journal error:', error);
    next(error);
  }
};
