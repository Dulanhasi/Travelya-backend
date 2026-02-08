const db = require('../config/database');

/**
 * Create a service booking request
 * POST /api/bookings
 */
exports.createBooking = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const {
      providerId,
      packageId,
      tripId,
      requestDate,
      numberOfPeople,
      specialRequirements
    } = req.body;

    if (!providerId || !requestDate || !numberOfPeople) {
      return res.status(400).json({
        success: false,
        message: 'Provider ID, request date, and number of people are required'
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
        message: 'Only travelers can create bookings'
      });
    }

    const travelerId = travelers[0].travelerId;

    // Verify provider exists and is approved
    const [providerCheck] = await db.query(
      'SELECT providerId, isApproved FROM service_providers WHERE providerId = ?',
      [providerId]
    );

    if (providerCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service provider not found'
      });
    }

    if (!providerCheck[0].isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book an unapproved service provider'
      });
    }

    // Calculate total amount if package is selected
    let totalAmount = null;
    if (packageId) {
      const [packages] = await db.query(
        'SELECT price, maxPeople FROM service_packages WHERE packageId = ? AND providerId = ? AND isActive = TRUE',
        [packageId, providerId]
      );

      if (packages.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Package not found or inactive for this provider'
        });
      }

      if (packages[0].maxPeople && numberOfPeople > packages[0].maxPeople) {
        return res.status(400).json({
          success: false,
          message: `Number of people exceeds package limit of ${packages[0].maxPeople}`
        });
      }

      totalAmount = packages[0].price * numberOfPeople;
    }

    const [result] = await db.query(
      `INSERT INTO service_requests
      (travelerId, providerId, packageId, tripId, requestDate, numberOfPeople, specialRequirements, totalAmount)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [travelerId, providerId, packageId, tripId, requestDate, numberOfPeople, specialRequirements, totalAmount]
    );

    res.status(201).json({
      success: true,
      message: 'Booking request created successfully',
      data: {
        requestId: result.insertId,
        totalAmount
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    next(error);
  }
};

/**
 * Get my bookings (for travelers)
 * GET /api/bookings/my-bookings
 */
exports.getMyBookings = async (req, res, next) => {
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
        message: 'Only travelers can view bookings'
      });
    }

    const travelerId = travelers[0].travelerId;

    let query = `
      SELECT
        sr.requestId,
        sr.providerId,
        sr.packageId,
        sr.tripId,
        sr.requestDate,
        sr.numberOfPeople,
        sr.specialRequirements,
        sr.status,
        sr.totalAmount,
        sr.isPaid,
        sr.createdAt,
        sp.businessName,
        sp.providerType,
        u.contactNo,
        pkg.packageName,
        pkg.description as packageDescription
      FROM service_requests sr
      JOIN service_providers sp ON sr.providerId = sp.providerId
      JOIN users u ON sp.userId = u.userId
      LEFT JOIN service_packages pkg ON sr.packageId = pkg.packageId
      WHERE sr.travelerId = ?
    `;

    const params = [travelerId];

    if (status) {
      query += ' AND sr.status = ?';
      params.push(status);
    }

    query += ' ORDER BY sr.createdAt DESC';

    const [bookings] = await db.query(query, params);

    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    next(error);
  }
};

/**
 * Get booking requests for provider
 * GET /api/bookings/provider-requests
 */
exports.getProviderRequests = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    // Get provider ID
    const [providers] = await db.query(
      'SELECT providerId FROM service_providers WHERE userId = ?',
      [userId]
    );

    if (providers.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only service providers can view requests'
      });
    }

    const providerId = providers[0].providerId;

    let query = `
      SELECT
        sr.requestId,
        sr.packageId,
        sr.tripId,
        sr.requestDate,
        sr.numberOfPeople,
        sr.specialRequirements,
        sr.status,
        sr.totalAmount,
        sr.isPaid,
        sr.createdAt,
        u.firstName,
        u.lastName,
        u.email,
        u.contactNo,
        pkg.packageName
      FROM service_requests sr
      JOIN travelers t ON sr.travelerId = t.travelerId
      JOIN users u ON t.userId = u.userId
      LEFT JOIN service_packages pkg ON sr.packageId = pkg.packageId
      WHERE sr.providerId = ?
    `;

    const params = [providerId];

    if (status) {
      query += ' AND sr.status = ?';
      params.push(status);
    }

    query += ' ORDER BY sr.createdAt DESC';

    const [requests] = await db.query(query, params);

    res.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error) {
    console.error('Get provider requests error:', error);
    next(error);
  }
};

/**
 * Get booking by ID
 * GET /api/bookings/:requestId
 */
exports.getBookingById = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;

    const [bookings] = await db.query(
      `SELECT
        sr.requestId,
        sr.travelerId,
        sr.providerId,
        sr.packageId,
        sr.tripId,
        sr.requestDate,
        sr.numberOfPeople,
        sr.specialRequirements,
        sr.status,
        sr.totalAmount,
        sr.isPaid,
        sr.paymentIntentId,
        sr.createdAt,
        sr.updatedAt,
        sp.businessName,
        sp.providerType,
        sp.contactNo as providerContact,
        pkg.packageName,
        pkg.description as packageDescription,
        u.firstName,
        u.lastName,
        u.email,
        u.contactNo as travelerContact
      FROM service_requests sr
      JOIN service_providers sp ON sr.providerId = sp.providerId
      JOIN travelers t ON sr.travelerId = t.travelerId
      JOIN users u ON t.userId = u.userId
      LEFT JOIN service_packages pkg ON sr.packageId = pkg.packageId
      WHERE sr.requestId = ?`,
      [requestId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const booking = bookings[0];

    // Check authorization (only traveler or provider can view)
    const [userCheck] = await db.query(
      `SELECT 1 FROM travelers WHERE travelerId = ? AND userId = ?
      UNION
      SELECT 1 FROM service_providers WHERE providerId = ? AND userId = ?`,
      [booking.travelerId, userId, booking.providerId, userId]
    );

    if (userCheck.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking by ID error:', error);
    next(error);
  }
};

/**
 * Update booking status (for provider)
 * PATCH /api/bookings/:requestId/status
 */
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // Get provider ID
    const [providers] = await db.query(
      'SELECT providerId FROM service_providers WHERE userId = ?',
      [userId]
    );

    if (providers.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only service providers can update booking status'
      });
    }

    const providerId = providers[0].providerId;

    // Check if booking belongs to this provider
    const [bookings] = await db.query(
      'SELECT requestId FROM service_requests WHERE requestId = ? AND providerId = ?',
      [requestId, providerId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized'
      });
    }

    await db.query(
      'UPDATE service_requests SET status = ? WHERE requestId = ?',
      [status, requestId]
    );

    res.json({
      success: true,
      message: 'Booking status updated successfully'
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    next(error);
  }
};

/**
 * Cancel booking (for traveler)
 * PATCH /api/bookings/:requestId/cancel
 */
exports.cancelBooking = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;

    // Get traveler ID
    const [travelers] = await db.query(
      'SELECT travelerId FROM travelers WHERE userId = ?',
      [userId]
    );

    if (travelers.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only travelers can cancel bookings'
      });
    }

    const travelerId = travelers[0].travelerId;

    // Check if booking belongs to this traveler
    const [bookings] = await db.query(
      'SELECT requestId, status FROM service_requests WHERE requestId = ? AND travelerId = ?',
      [requestId, travelerId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized'
      });
    }

    if (bookings[0].status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed bookings'
      });
    }

    await db.query(
      'UPDATE service_requests SET status = ? WHERE requestId = ?',
      ['cancelled', requestId]
    );

    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    next(error);
  }
};

/**
 * Update payment status
 * PATCH /api/bookings/:requestId/payment
 */
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { requestId } = req.params;
    const { isPaid, paymentIntentId } = req.body;

    // Get traveler ID
    const [travelers] = await db.query(
      'SELECT travelerId FROM travelers WHERE userId = ?',
      [userId]
    );

    if (travelers.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Only travelers can update payment status'
      });
    }

    const travelerId = travelers[0].travelerId;

    // Check if booking belongs to this traveler
    const [bookings] = await db.query(
      'SELECT requestId FROM service_requests WHERE requestId = ? AND travelerId = ?',
      [requestId, travelerId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or unauthorized'
      });
    }

    await db.query(
      'UPDATE service_requests SET isPaid = ?, paymentIntentId = ? WHERE requestId = ?',
      [isPaid, paymentIntentId, requestId]
    );

    res.json({
      success: true,
      message: 'Payment status updated successfully'
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    next(error);
  }
};
