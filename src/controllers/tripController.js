// const db = require('../config/database');
// const { generateItineraryWithRetry } = require('../utils/n8nIntegration');

// /**
//  * Generate AI-powered trip itinerary using n8n
//  * POST /api/trips/generate
//  */
// exports.generateItinerary = async (req, res, next) => {
//     try {
//         const { destination, startDate, endDate, budget, numberOfTravelers, preferences, activities } = req.body;
//         const travelerId = req.user.travelerId;

//         // Validate required fields
//         if (!destination || !startDate || !endDate || !budget) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Missing required fields: destination, startDate, endDate, budget'
//             });
//         }

//         // Prepare data for n8n
//         const tripData = {
//             destination,
//             startDate,
//             endDate,
//             budget: parseFloat(budget),
//             numberOfTravelers: parseInt(numberOfTravelers) || 1,
//             preferences: preferences || [],
//             activities: activities || []
//         };

//         // Call n8n workflow
//         console.log('🤖 Generating itinerary with AI...');
//         const n8nResult = await generateItineraryWithRetry(tripData);

//         res.json({
//             success: true,
//             message: 'Itinerary generated successfully',
//             data: {
//                 itinerary: n8nResult.data,
//                 metadata: {
//                     destination,
//                     startDate,
//                     endDate,
//                     budget,
//                     numberOfTravelers
//                 }
//             }
//         });
//     } catch (error) {
//         console.error('Generate itinerary error:', error);
//         next(error);
//     }
// };

// /**
//  * Save trip plan to database
//  * POST /api/trips/save
//  */
// exports.saveTrip = async (req, res, next) => {
//     try {
//         const { tripName, startDate, endDate, budget, numberOfTravelers, preferences, itinerary } = req.body;
//         const userId = req.user.uid;

//         // Get travelerId from userId
//         const [travelers] = await db.query(
//             'SELECT travelerId FROM travelers WHERE userId = (SELECT userId FROM users WHERE firebaseUid = ?)',
//             [userId]
//         );

//         if (travelers.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Traveler profile not found'
//             });
//         }

//         const travelerId = travelers[0].travelerId;

//         // Insert trip plan
//         const [result] = await db.query(
//             `INSERT INTO trip_plans 
//             (travelerId, tripName, startDate, endDate, budget, numberOfTravelers, preferences, itinerary, status) 
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//             [
//                 travelerId,
//                 tripName,
//                 startDate,
//                 endDate,
//                 budget,
//                 numberOfTravelers,
//                 JSON.stringify(preferences || []),
//                 JSON.stringify(itinerary),
//                 'planning'
//             ]
//         );

//         res.status(201).json({
//             success: true,
//             message: 'Trip saved successfully',
//             data: {
//                 tripId: result.insertId
//             }
//         });
//     } catch (error) {
//         console.error('Save trip error:', error);
//         next(error);
//     }
// };

// /**
//  * Get all trips for logged-in user
//  * GET /api/trips
//  */
// exports.getUserTrips = async (req, res, next) => {
//     try {
//         const userId = req.user.uid;

//         const [trips] = await db.query(
//             `SELECT 
//                 tp.tripId,
//                 tp.tripName,
//                 tp.startDate,
//                 tp.endDate,
//                 tp.budget,
//                 tp.numberOfTravelers,
//                 tp.preferences,
//                 tp.status,
//                 tp.createdAt
//             FROM trip_plans tp
//             JOIN travelers t ON tp.travelerId = t.travelerId
//             JOIN users u ON t.userId = u.userId
//             WHERE u.firebaseUid = ?
//             ORDER BY tp.startDate DESC`,
//             [userId]
//         );

//         // Parse JSON fields
//         trips.forEach(trip => {
//             if (trip.preferences) {
//                 trip.preferences = JSON.parse(trip.preferences);
//             }
//         });

//         res.json({
//             success: true,
//             data: trips
//         });
//     } catch (error) {
//         console.error('Get user trips error:', error);
//         next(error);
//     }
// };

// /**
//  * Get trip details by ID
//  * GET /api/trips/:tripId
//  */
// exports.getTripById = async (req, res, next) => {
//     try {
//         const { tripId } = req.params;
//         const userId = req.user.uid;

//         const [trips] = await db.query(
//             `SELECT 
//                 tp.*,
//                 t.travelerId,
//                 u.firebaseUid
//             FROM trip_plans tp
//             JOIN travelers t ON tp.travelerId = t.travelerId
//             JOIN users u ON t.userId = u.userId
//             WHERE tp.tripId = ? AND u.firebaseUid = ?`,
//             [tripId, userId]
//         );

//         if (trips.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Trip not found'
//             });
//         }

//         const trip = trips[0];
        
//         // Parse JSON fields
//         if (trip.preferences) trip.preferences = JSON.parse(trip.preferences);
//         if (trip.itinerary) trip.itinerary = JSON.parse(trip.itinerary);

//         // Get associated locations
//         const [locations] = await db.query(
//             `SELECT 
//                 tl.tripLocationId,
//                 tl.visitDate,
//                 tl.dayNumber,
//                 tl.notes,
//                 l.locationId,
//                 l.name,
//                 l.category,
//                 l.coordinates
//             FROM trip_locations tl
//             JOIN locations l ON tl.locationId = l.locationId
//             WHERE tl.tripId = ?
//             ORDER BY tl.dayNumber, tl.orderInDay`,
//             [tripId]
//         );

//         trip.locations = locations;

//         res.json({
//             success: true,
//             data: trip
//         });
//     } catch (error) {
//         console.error('Get trip by ID error:', error);
//         next(error);
//     }
// };

// /**
//  * Update trip status
//  * PATCH /api/trips/:tripId/status
//  */
// exports.updateTripStatus = async (req, res, next) => {
//     try {
//         const { tripId } = req.params;
//         const { status } = req.body;
//         const userId = req.user.uid;

//         const validStatuses = ['planning', 'confirmed', 'ongoing', 'completed', 'cancelled'];
//         if (!validStatuses.includes(status)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Invalid status value'
//             });
//         }

//         const [result] = await db.query(
//             `UPDATE trip_plans tp
//             JOIN travelers t ON tp.travelerId = t.travelerId
//             JOIN users u ON t.userId = u.userId
//             SET tp.status = ?
//             WHERE tp.tripId = ? AND u.firebaseUid = ?`,
//             [status, tripId, userId]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Trip not found or unauthorized'
//             });
//         }

//         res.json({
//             success: true,
//             message: 'Trip status updated successfully'
//         });
//     } catch (error) {
//         console.error('Update trip status error:', error);
//         next(error);
//     }
// };

// /**
//  * Delete trip
//  * DELETE /api/trips/:tripId
//  */
// exports.deleteTrip = async (req, res, next) => {
//     try {
//         const { tripId } = req.params;
//         const userId = req.user.uid;

//         const [result] = await db.query(
//             `DELETE tp FROM trip_plans tp
//             JOIN travelers t ON tp.travelerId = t.travelerId
//             JOIN users u ON t.userId = u.userId
//             WHERE tp.tripId = ? AND u.firebaseUid = ?`,
//             [tripId, userId]
//         );

//         if (result.affectedRows === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Trip not found or unauthorized'
//             });
//         }

//         res.json({
//             success: true,
//             message: 'Trip deleted successfully'
//         });
//     } catch (error) {
//         console.error('Delete trip error:', error);
//         next(error);
//     }
// };


// controllers/tripController.js
const db = require('../config/database');
const { generateItineraryWithRetry } = require('../utils/n8nIntegration');

/**
 * Helper: get identity info from req.user and ensure auth
 * Returns an object: { firebaseUid, userId, travelerId }
 * May do DB lookups to resolve missing ids.
 */
async function resolveUserContext(req) {
  // req.user may contain: uid (firebase uid), firebaseUid, userId (db id), travelerId
  const firebaseUid = req.user?.uid || req.user?.firebaseUid || null;
  const userIdFromReq = req.user?.userId || null; // DB userId if middleware attached it
  let userId = userIdFromReq;
  let travelerId = req.user?.travelerId || null;

  // If we don't have DB userId but have firebaseUid, try to resolve
  if (!userId && firebaseUid) {
    const [rows] = await db.query('SELECT userId FROM users WHERE firebaseUid = ?', [firebaseUid]);
    if (rows.length) userId = rows[0].userId;
  }

  // If we still don't have travelerId, try to find it from travelers table using userId
  if (!travelerId && userId) {
    const [trows] = await db.query('SELECT travelerId FROM travelers WHERE userId = ?', [userId]);
    if (trows.length) travelerId = trows[0].travelerId;
  }

  return { firebaseUid, userId, travelerId };
}

/**
 * Generate AI-powered trip itinerary using n8n
 * POST /api/trips/generate
 */
exports.generateItinerary = async (req, res, next) => {
  try {
    // Resolve context and require authenticated traveler
    const { firebaseUid, userId, travelerId } = await resolveUserContext(req);

    if (!firebaseUid && !userId) {
      return res.status(401).json({ success: false, message: 'Authenticated user required' });
    }

    // If travelerId not known, still allow generation but note: saving requires traveler profile
    const { destination, startDate, endDate, budget, numberOfTravelers, preferences, activities } = req.body;

    // Validate required fields
    if (!destination || !startDate || !endDate || budget === undefined || budget === null) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: destination, startDate, endDate, budget'
      });
    }

    // Prepare data for n8n
    const tripData = {
      destination,
      startDate,
      endDate,
      budget: parseFloat(budget),
      numberOfTravelers: parseInt(numberOfTravelers, 10) || 1,
      preferences: preferences || [],
      activities: activities || []
    };

    // Call n8n workflow (with retry helper)
    console.log('🤖 Generating itinerary with AI...');
    const n8nResult = await generateItineraryWithRetry(tripData);

    res.json({
      success: true,
      message: 'Itinerary generated successfully',
      data: {
        itinerary: n8nResult.data,
        metadata: {
          destination,
          startDate,
          endDate,
          budget,
          numberOfTravelers: tripData.numberOfTravelers,
          travelerId: travelerId || null
        }
      }
    });
  } catch (error) {
    console.error('Generate itinerary error:', error);
    next(error);
  }
};

/**
 * Save trip plan to database
 * POST /api/trips/save
 */
exports.saveTrip = async (req, res, next) => {
  try {
    // Resolve user & traveler
    const { firebaseUid, userId: resolvedUserId, travelerId: ctxTravelerId } = await resolveUserContext(req);

    if (!resolvedUserId && !firebaseUid) {
      return res.status(401).json({ success: false, message: 'Authenticated user required' });
    }

    // Determine travelerId:
    let travelerId = ctxTravelerId;
    if (!travelerId) {
      // Try to find traveller from userId or firebaseUid
      if (resolvedUserId) {
        const [trows] = await db.query('SELECT travelerId FROM travelers WHERE userId = ?', [resolvedUserId]);
        if (trows.length) travelerId = trows[0].travelerId;
      }
      if (!travelerId && firebaseUid) {
        const [urows] = await db.query('SELECT userId FROM users WHERE firebaseUid = ?', [firebaseUid]);
        if (urows.length) {
          const [trows] = await db.query('SELECT travelerId FROM travelers WHERE userId = ?', [urows[0].userId]);
          if (trows.length) travelerId = trows[0].travelerId;
        }
      }
    }

    if (!travelerId) {
      return res.status(404).json({ success: false, message: 'Traveler profile not found' });
    }

    const { tripName, startDate, endDate, budget, numberOfTravelers, preferences, itinerary } = req.body;

    // Basic validation (tripName optional, but start/end/budget recommended)
    if (!startDate || !endDate || budget === undefined || budget === null) {
      return res.status(400).json({ success: false, message: 'Missing required trip fields (startDate, endDate, budget)' });
    }

    const [result] = await db.query(
      `INSERT INTO trip_plans 
         (travelerId, tripName, startDate, endDate, budget, numberOfTravelers, preferences, itinerary, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        travelerId,
        tripName || null,
        startDate,
        endDate,
        budget,
        numberOfTravelers || 1,
        JSON.stringify(preferences || []),
        JSON.stringify(itinerary || {}),
        'planning'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Trip saved successfully',
      data: { tripId: result.insertId }
    });
  } catch (error) {
    console.error('Save trip error:', error);
    next(error);
  }
};

/**
 * Get all trips for logged-in user
 * GET /api/trips
 */
exports.getUserTrips = async (req, res, next) => {
  try {
    // Resolve user identity
    const { firebaseUid, userId } = await resolveUserContext(req);

    if (!firebaseUid && !userId) {
      return res.status(401).json({ success: false, message: 'Authenticated user required' });
    }

    // Use firebaseUid if that's what your queries expect; otherwise use DB userId
    const userIdentifier = userId ? userId : firebaseUid;

    // We'll query by firebaseUid if userId is not available (original code used firebaseUid)
    const queryParam = userId ? userId : firebaseUid;

    const [trips] = await db.query(
      `SELECT 
         tp.tripId,
         tp.tripName,
         tp.startDate,
         tp.endDate,
         tp.budget,
         tp.numberOfTravelers,
         tp.preferences,
         tp.status,
         tp.createdAt
       FROM trip_plans tp
       JOIN travelers t ON tp.travelerId = t.travelerId
       JOIN users u ON t.userId = u.userId
       WHERE ${userId ? 'u.userId = ?' : 'u.firebaseUid = ?'}
       ORDER BY tp.startDate DESC`,
      [queryParam]
    );

    // Parse JSON fields
    trips.forEach(trip => {
      try { if (trip.preferences) trip.preferences = JSON.parse(trip.preferences); } catch (e) { trip.preferences = []; }
      try { if (trip.itinerary) trip.itinerary = JSON.parse(trip.itinerary); } catch (e) { trip.itinerary = {}; }
    });

    res.json({ success: true, data: trips });
  } catch (error) {
    console.error('Get user trips error:', error);
    next(error);
  }
};

/**
 * Get trip details by ID
 * GET /api/trips/:tripId
 */
exports.getTripById = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { firebaseUid, userId } = await resolveUserContext(req);

    if (!firebaseUid && !userId) {
      return res.status(401).json({ success: false, message: 'Authenticated user required' });
    }

    const queryParam = userId ? userId : firebaseUid;

    const [trips] = await db.query(
      `SELECT 
         tp.*,
         t.travelerId,
         u.firebaseUid
       FROM trip_plans tp
       JOIN travelers t ON tp.travelerId = t.travelerId
       JOIN users u ON t.userId = u.userId
       WHERE tp.tripId = ? AND ${userId ? 'u.userId = ?' : 'u.firebaseUid = ?'}`,
      [tripId, queryParam]
    );

    if (trips.length === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const trip = trips[0];

    // Parse JSON fields
    try { if (trip.preferences) trip.preferences = JSON.parse(trip.preferences); } catch (e) { trip.preferences = []; }
    try { if (trip.itinerary) trip.itinerary = JSON.parse(trip.itinerary); } catch (e) { trip.itinerary = {}; }

    // Get associated locations (optional)
    const [locations] = await db.query(
      `SELECT 
         tl.tripLocationId,
         tl.visitDate,
         tl.dayNumber,
         tl.notes,
         l.locationId,
         l.name,
         l.category,
         l.coordinates
       FROM trip_locations tl
       JOIN locations l ON tl.locationId = l.locationId
       WHERE tl.tripId = ?
       ORDER BY tl.dayNumber, tl.orderInDay`,
      [tripId]
    );

    // Parse coordinates JSON for locations if present
    locations.forEach(loc => {
      try { if (loc.coordinates) loc.coordinates = JSON.parse(loc.coordinates); } catch (e) { loc.coordinates = null; }
    });

    trip.locations = locations;

    res.json({ success: true, data: trip });
  } catch (error) {
    console.error('Get trip by ID error:', error);
    next(error);
  }
};

/**
 * Update trip status
 * PATCH /api/trips/:tripId/status
 */
exports.updateTripStatus = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { status } = req.body;
    const { firebaseUid, userId } = await resolveUserContext(req);

    if (!firebaseUid && !userId) {
      return res.status(401).json({ success: false, message: 'Authenticated user required' });
    }

    const validStatuses = ['planning', 'confirmed', 'ongoing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const queryParam = userId ? userId : firebaseUid;

    const [result] = await db.query(
      `UPDATE trip_plans tp
       JOIN travelers t ON tp.travelerId = t.travelerId
       JOIN users u ON t.userId = u.userId
       SET tp.status = ?
       WHERE tp.tripId = ? AND ${userId ? 'u.userId = ?' : 'u.firebaseUid = ?'}`,
      [status, tripId, queryParam]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found or unauthorized' });
    }

    res.json({ success: true, message: 'Trip status updated successfully' });
  } catch (error) {
    console.error('Update trip status error:', error);
    next(error);
  }
};

/**
 * Delete trip
 * DELETE /api/trips/:tripId
 */
exports.deleteTrip = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const { firebaseUid, userId } = await resolveUserContext(req);

    if (!firebaseUid && !userId) {
      return res.status(401).json({ success: false, message: 'Authenticated user required' });
    }

    const queryParam = userId ? userId : firebaseUid;

    const [result] = await db.query(
      `DELETE tp FROM trip_plans tp
       JOIN travelers t ON tp.travelerId = t.travelerId
       JOIN users u ON t.userId = u.userId
       WHERE tp.tripId = ? AND ${userId ? 'u.userId = ?' : 'u.firebaseUid = ?'}`,
      [tripId, queryParam]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Trip not found or unauthorized' });
    }

    res.json({ success: true, message: 'Trip deleted successfully' });
  } catch (error) {
    console.error('Delete trip error:', error);
    next(error);
  }
};
