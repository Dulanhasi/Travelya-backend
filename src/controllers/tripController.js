const db = require('../config/database');
const { generateItineraryWithRetry } = require('../utils/n8nIntegration');

/**
 * Generate AI-powered trip itinerary using n8n
 * POST /api/trips/generate
 */
exports.generateItinerary = async (req, res, next) => {
    try {
        const { destination, startDate, endDate, budget, numberOfTravelers, preferences, activities } = req.body;
        const travelerId = req.user.travelerId;

        // Validate required fields
        if (!destination || !startDate || !endDate || !budget) {
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
            numberOfTravelers: parseInt(numberOfTravelers) || 1,
            preferences: preferences || [],
            activities: activities || []
        };

        // Call n8n workflow
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
                    numberOfTravelers
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
        const { tripName, startDate, endDate, budget, numberOfTravelers, preferences, itinerary } = req.body;
        const userId = req.user.uid;

        // Get travelerId from userId
        const [travelers] = await db.query(
            'SELECT travelerId FROM travelers WHERE userId = (SELECT userId FROM users WHERE firebaseUid = ?)',
            [userId]
        );

        if (travelers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Traveler profile not found'
            });
        }

        const travelerId = travelers[0].travelerId;

        // Insert trip plan
        const [result] = await db.query(
            `INSERT INTO trip_plans 
            (travelerId, tripName, startDate, endDate, budget, numberOfTravelers, preferences, itinerary, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                travelerId,
                tripName,
                startDate,
                endDate,
                budget,
                numberOfTravelers,
                JSON.stringify(preferences || []),
                JSON.stringify(itinerary),
                'planning'
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Trip saved successfully',
            data: {
                tripId: result.insertId
            }
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
        const userId = req.user.uid;

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
            WHERE u.firebaseUid = ?
            ORDER BY tp.startDate DESC`,
            [userId]
        );

        // Parse JSON fields
        trips.forEach(trip => {
            if (trip.preferences) {
                trip.preferences = JSON.parse(trip.preferences);
            }
        });

        res.json({
            success: true,
            data: trips
        });
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
        const userId = req.user.uid;

        const [trips] = await db.query(
            `SELECT 
                tp.*,
                t.travelerId,
                u.firebaseUid
            FROM trip_plans tp
            JOIN travelers t ON tp.travelerId = t.travelerId
            JOIN users u ON t.userId = u.userId
            WHERE tp.tripId = ? AND u.firebaseUid = ?`,
            [tripId, userId]
        );

        if (trips.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        const trip = trips[0];
        
        // Parse JSON fields
        if (trip.preferences) trip.preferences = JSON.parse(trip.preferences);
        if (trip.itinerary) trip.itinerary = JSON.parse(trip.itinerary);

        // Get associated locations
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

        trip.locations = locations;

        res.json({
            success: true,
            data: trip
        });
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
        const userId = req.user.uid;

        const validStatuses = ['planning', 'confirmed', 'ongoing', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const [result] = await db.query(
            `UPDATE trip_plans tp
            JOIN travelers t ON tp.travelerId = t.travelerId
            JOIN users u ON t.userId = u.userId
            SET tp.status = ?
            WHERE tp.tripId = ? AND u.firebaseUid = ?`,
            [status, tripId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found or unauthorized'
            });
        }

        res.json({
            success: true,
            message: 'Trip status updated successfully'
        });
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
        const userId = req.user.uid;

        const [result] = await db.query(
            `DELETE tp FROM trip_plans tp
            JOIN travelers t ON tp.travelerId = t.travelerId
            JOIN users u ON t.userId = u.userId
            WHERE tp.tripId = ? AND u.firebaseUid = ?`,
            [tripId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found or unauthorized'
            });
        }

        res.json({
            success: true,
            message: 'Trip deleted successfully'
        });
    } catch (error) {
        console.error('Delete trip error:', error);
        next(error);
    }
};
