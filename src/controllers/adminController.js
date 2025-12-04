// const db = require('../config/database');

// /**
//  * Get pending service providers
//  * GET /api/admin/pending-providers
//  */
// exports.getPendingProviders = async (req, res, next) => {
//   try {
//     const [providers] = await db.query(
//       `SELECT
//         sp.providerId,
//         sp.userId,
//         sp.businessName,
//         sp.providerType,
//         sp.businessRegistrationNo,
//         sp.description,
//         sp.address,
//         sp.locationLat,
//         sp.locationLng,
//         sp.isApproved,
//         u.email,
//         u.firstName,
//         u.lastName,
//         u.contactNo,
//         u.profileImage,
//         u.createdAt
//       FROM service_providers sp
//       JOIN users u ON sp.userId = u.userId
//       WHERE sp.isApproved = FALSE
//       ORDER BY u.createdAt DESC`
//     );

//     res.json({
//       success: true,
//       data: providers,
//       count: providers.length
//     });
//   } catch (error) {
//     console.error('Get pending providers error:', error);
//     next(error);
//   }
// };

// /**
//  * Approve service provider
//  * POST /api/admin/approve-provider/:userId
//  */
// exports.approveProvider = async (req, res, next) => {
//   try {
//     const { userId } = req.params;
//     const adminUserId = req.user.userId;

//     // Check if provider exists
//     const [providers] = await db.query(
//       'SELECT providerId FROM service_providers WHERE userId = ?',
//       [userId]
//     );

//     if (providers.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Service provider not found'
//       });
//     }

//     // Update approval status
//     await db.query(
//       `UPDATE service_providers
//       SET isApproved = TRUE, approvedAt = NOW(), approvedBy = ?
//       WHERE userId = ?`,
//       [adminUserId, userId]
//     );

//     // Create notification for the provider
//     await db.query(
//       `INSERT INTO notifications (userId, title, message, type)
//       VALUES (?, ?, ?, ?)`,
//       [
//         userId,
//         'Account Approved',
//         'Your service provider account has been approved. You can now start offering your services!',
//         'success'
//       ]
//     );

//     res.json({
//       success: true,
//       message: 'Service provider approved successfully'
//     });
//   } catch (error) {
//     console.error('Approve provider error:', error);
//     next(error);
//   }
// };

// /**
//  * Reject service provider
//  * POST /api/admin/reject-provider/:userId
//  */
// exports.rejectProvider = async (req, res, next) => {
//   try {
//     const { userId } = req.params;
//     const { reason } = req.body;

//     if (!reason) {
//       return res.status(400).json({
//         success: false,
//         message: 'Rejection reason is required'
//       });
//     }

//     // Check if provider exists
//     const [providers] = await db.query(
//       'SELECT providerId FROM service_providers WHERE userId = ?',
//       [userId]
//     );

//     if (providers.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Service provider not found'
//       });
//     }

//     // For now, we'll keep the record but mark as not approved
//     // You could also delete the provider or add a rejection flag
//     await db.query(
//       'UPDATE service_providers SET isApproved = FALSE WHERE userId = ?',
//       [userId]
//     );

//     // Create notification for the provider
//     await db.query(
//       `INSERT INTO notifications (userId, title, message, type)
//       VALUES (?, ?, ?, ?)`,
//       [
//         userId,
//         'Account Not Approved',
//         `Your service provider application was not approved. Reason: ${reason}`,
//         'error'
//       ]
//     );

//     res.json({
//       success: true,
//       message: 'Service provider rejected successfully'
//     });
//   } catch (error) {
//     console.error('Reject provider error:', error);
//     next(error);
//   }
// };

// /**
//  * Get all users
//  * GET /api/admin/users
//  */
// exports.getAllUsers = async (req, res, next) => {
//   try {
//     const { userType, isActive, search } = req.query;

//     let query = `
//       SELECT
//         userId,
//         firebaseUid,
//         email,
//         userType,
//         firstName,
//         lastName,
//         contactNo,
//         profileImage,
//         gender,
//         isActive,
//         isVerified,
//         createdAt
//       FROM users
//       WHERE 1=1
//     `;

//     const params = [];

//     if (userType) {
//       query += ' AND userType = ?';
//       params.push(userType);
//     }

//     if (isActive !== undefined) {
//       query += ' AND isActive = ?';
//       params.push(isActive === 'true' ? 1 : 0);
//     }

//     if (search) {
//       query += ' AND (email LIKE ? OR firstName LIKE ? OR lastName LIKE ?)';
//       params.push(`%${search}%`, `%${search}%`, `%${search}%`);
//     }

//     query += ' ORDER BY createdAt DESC';

//     const [users] = await db.query(query, params);

//     res.json({
//       success: true,
//       data: users,
//       count: users.length
//     });
//   } catch (error) {
//     console.error('Get all users error:', error);
//     next(error);
//   }
// };

// /**
//  * Toggle user active status
//  * PUT /api/admin/user-status/:userId
//  */
// exports.toggleUserStatus = async (req, res, next) => {
//   try {
//     const { userId } = req.params;
//     const { isActive } = req.body;

//     if (isActive === undefined) {
//       return res.status(400).json({
//         success: false,
//         message: 'isActive field is required'
//       });
//     }

//     // Check if user exists
//     const [users] = await db.query(
//       'SELECT userId, email FROM users WHERE userId = ?',
//       [userId]
//     );

//     if (users.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'User not found'
//       });
//     }

//     // Update user status
//     await db.query(
//       'UPDATE users SET isActive = ? WHERE userId = ?',
//       [isActive, userId]
//     );

//     // Create notification
//     await db.query(
//       `INSERT INTO notifications (userId, title, message, type)
//       VALUES (?, ?, ?, ?)`,
//       [
//         userId,
//         isActive ? 'Account Activated' : 'Account Deactivated',
//         isActive
//           ? 'Your account has been activated by an administrator.'
//           : 'Your account has been deactivated by an administrator.',
//         isActive ? 'success' : 'warning'
//       ]
//     );

//     res.json({
//       success: true,
//       message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
//     });
//   } catch (error) {
//     console.error('Toggle user status error:', error);
//     next(error);
//   }
// };

// /**
//  * Get pending locations
//  * GET /api/admin/pending-locations
//  */
// exports.getPendingLocations = async (req, res, next) => {
//   try {
//     const [locations] = await db.query(
//       `SELECT
//         l.locationId,
//         l.name,
//         l.category,
//         l.description,
//         l.coordinates,
//         l.address,
//         l.district,
//         l.province,
//         l.images,
//         l.entryFee,
//         l.openingHours,
//         l.suggestedBy,
//         l.createdAt,
//         u.email as suggestedByEmail,
//         u.firstName as suggestedByFirstName,
//         u.lastName as suggestedByLastName
//       FROM locations l
//       LEFT JOIN users u ON l.suggestedBy = u.userId
//       WHERE l.isApproved = FALSE
//       ORDER BY l.createdAt DESC`
//     );

//     // Parse JSON fields
//     locations.forEach(loc => {
//       if (loc.coordinates) loc.coordinates = JSON.parse(loc.coordinates);
//       if (loc.images) loc.images = JSON.parse(loc.images);
//       if (loc.openingHours) loc.openingHours = JSON.parse(loc.openingHours);
//     });

//     res.json({
//       success: true,
//       data: locations,
//       count: locations.length
//     });
//   } catch (error) {
//     console.error('Get pending locations error:', error);
//     next(error);
//   }
// };

// /**
//  * Approve location
//  * POST /api/admin/approve-location/:locationId
//  */
// exports.approveLocation = async (req, res, next) => {
//   try {
//     const { locationId } = req.params;
//     const adminUserId = req.user.userId;

//     // Check if location exists
//     const [locations] = await db.query(
//       'SELECT locationId, suggestedBy FROM locations WHERE locationId = ?',
//       [locationId]
//     );

//     if (locations.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Location not found'
//       });
//     }

//     const location = locations[0];

//     // Update approval status
//     await db.query(
//       `UPDATE locations
//       SET isApproved = TRUE, approvedAt = NOW(), approvedBy = ?
//       WHERE locationId = ?`,
//       [adminUserId, locationId]
//     );

//     // Create notification for the user who suggested it
//     if (location.suggestedBy) {
//       await db.query(
//         `INSERT INTO notifications (userId, title, message, type, relatedEntityType, relatedEntityId)
//         VALUES (?, ?, ?, ?, ?, ?)`,
//         [
//           location.suggestedBy,
//           'Location Approved',
//           'Your suggested location has been approved and is now visible to all users!',
//           'success',
//           'location',
//           locationId
//         ]
//       );
//     }

//     res.json({
//       success: true,
//       message: 'Location approved successfully'
//     });
//   } catch (error) {
//     console.error('Approve location error:', error);
//     next(error);
//   }
// };

// /**
//  * Reject location
//  * POST /api/admin/reject-location/:locationId
//  */
// exports.rejectLocation = async (req, res, next) => {
//   try {
//     const { locationId } = req.params;
//     const { reason } = req.body;

//     if (!reason) {
//       return res.status(400).json({
//         success: false,
//         message: 'Rejection reason is required'
//       });
//     }

//     // Check if location exists
//     const [locations] = await db.query(
//       'SELECT locationId, suggestedBy FROM locations WHERE locationId = ?',
//       [locationId]
//     );

//     if (locations.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Location not found'
//       });
//     }

//     const location = locations[0];

//     // Delete the location (or you could keep it with a rejected flag)
//     await db.query('DELETE FROM locations WHERE locationId = ?', [locationId]);

//     // Create notification for the user who suggested it
//     if (location.suggestedBy) {
//       await db.query(
//         `INSERT INTO notifications (userId, title, message, type)
//         VALUES (?, ?, ?, ?)`,
//         [
//           location.suggestedBy,
//           'Location Not Approved',
//           `Your suggested location was not approved. Reason: ${reason}`,
//           'error'
//         ]
//       );
//     }

//     res.json({
//       success: true,
//       message: 'Location rejected successfully'
//     });
//   } catch (error) {
//     console.error('Reject location error:', error);
//     next(error);
//   }
// };

// /**
//  * Get approved locations
//  * GET /api/admin/approved-locations
//  */
// exports.getApprovedLocations = async (req, res, next) => {
//   try {
//     const [locations] = await db.query(
//       `SELECT
//         l.locationId,
//         l.name,
//         l.category,
//         l.description,
//         l.district,
//         l.province,
//         l.ratings,
//         l.totalReviews,
//         l.approvedAt,
//         l.createdAt,
//         u.email as approvedByEmail,
//         u.firstName as approvedByFirstName,
//         u.lastName as approvedByLastName
//       FROM locations l
//       LEFT JOIN users u ON l.approvedBy = u.userId
//       WHERE l.isApproved = TRUE
//       ORDER BY l.approvedAt DESC`
//     );

//     res.json({
//       success: true,
//       data: locations,
//       count: locations.length
//     });
//   } catch (error) {
//     console.error('Get approved locations error:', error);
//     next(error);
//   }
// };

// /**
//  * Get rejected locations (if you keep rejected records)
//  * GET /api/admin/rejected-locations
//  */
// exports.getRejectedLocations = async (req, res, next) => {
//   try {
//     // Since we delete rejected locations, this will return empty
//     // If you want to track rejections, add a 'rejectedAt' field instead of deleting
//     res.json({
//       success: true,
//       data: [],
//       count: 0,
//       message: 'Rejected locations are deleted from the system'
//     });
//   } catch (error) {
//     console.error('Get rejected locations error:', error);
//     next(error);
//   }
// };

// /**
//  * Get dashboard statistics
//  * GET /api/admin/stats
//  */
// exports.getDashboardStats = async (req, res, next) => {
//   try {
//     // Get total users by type
//     const [userStats] = await db.query(
//       `SELECT
//         userType,
//         COUNT(*) as count,
//         SUM(CASE WHEN isActive = TRUE THEN 1 ELSE 0 END) as activeCount
//       FROM users
//       GROUP BY userType`
//     );

//     // Get pending approvals
//     const [pendingStats] = await db.query(
//       `SELECT
//         (SELECT COUNT(*) FROM service_providers WHERE isApproved = FALSE) as pendingProviders,
//         (SELECT COUNT(*) FROM locations WHERE isApproved = FALSE) as pendingLocations`
//     );

//     // Get location stats
//     const [locationStats] = await db.query(
//       `SELECT
//         COUNT(*) as totalLocations,
//         SUM(CASE WHEN isApproved = TRUE THEN 1 ELSE 0 END) as approvedLocations,
//         SUM(CASE WHEN isApproved = FALSE THEN 1 ELSE 0 END) as pendingLocations
//       FROM locations`
//     );

//     // Get recent activity
//     const [recentUsers] = await db.query(
//       `SELECT COUNT(*) as newUsersToday
//       FROM users
//       WHERE DATE(createdAt) = CURDATE()`
//     );

//     res.json({
//       success: true,
//       data: {
//         users: userStats,
//         pending: pendingStats[0],
//         locations: locationStats[0],
//         recentActivity: recentUsers[0]
//       }
//     });
//   } catch (error) {
//     console.error('Get dashboard stats error:', error);
//     next(error);
//   }
// };


// controllers/adminController.js
const db = require('../config/database');

/**
 * Helper: require authenticated admin
 */
const requireAdmin = (req, res) => {
  if (!req.user || !req.user.userId) {
    res.status(401).json({ success: false, message: 'Authenticated admin required' });
    return false;
  }
  if (!req.user.isAdmin && !(req.user.userType && req.user.userType.toString().toLowerCase() === 'admin')) {
    res.status(403).json({ success: false, message: 'Admin privileges required' });
    return false;
  }
  return true;
};

/**
 * Get pending service providers
 * GET /api/admin/pending-providers
 */
exports.getPendingProviders = async (req, res, next) => {
  try {
    if (!requireAdmin(req, res)) return;

    const [providers] = await db.query(
      `SELECT
        sp.providerId,
        sp.userId,
        sp.businessName,
        sp.providerType,
        sp.businessRegistrationNo,
        sp.description,
        sp.address,
        sp.locationLat,
        sp.locationLng,
        sp.isApproved,
        u.email,
        u.firstName,
        u.lastName,
        u.contactNo,
        u.profileImage,
        u.createdAt
      FROM service_providers sp
      JOIN users u ON sp.userId = u.userId
      WHERE sp.isApproved = FALSE
      ORDER BY u.createdAt DESC`
    );

    res.json({ success: true, data: providers, count: providers.length });
  } catch (error) {
    console.error('Get pending providers error:', error);
    next(error);
  }
};

/**
 * Approve service provider
 * POST /api/admin/approve-provider/:userId
 */
exports.approveProvider = async (req, res, next) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { userId } = req.params;
    const adminUserId = req.user.userId;

    // Check if provider exists
    const [providers] = await db.query('SELECT providerId FROM service_providers WHERE userId = ?', [userId]);

    if (providers.length === 0) {
      return res.status(404).json({ success: false, message: 'Service provider not found' });
    }

    // Update approval status
    await db.query(
      `UPDATE service_providers
       SET isApproved = TRUE, approvedAt = NOW(), approvedBy = ?
       WHERE userId = ?`,
      [adminUserId, userId]
    );

    // Create notification for the provider
    await db.query(
      `INSERT INTO notifications (userId, title, message, type)
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        'Account Approved',
        'Your service provider account has been approved. You can now start offering your services!',
        'success'
      ]
    );

    res.json({ success: true, message: 'Service provider approved successfully' });
  } catch (error) {
    console.error('Approve provider error:', error);
    next(error);
  }
};

/**
 * Reject service provider
 * POST /api/admin/reject-provider/:userId
 */
exports.rejectProvider = async (req, res, next) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    // Check if provider exists
    const [providers] = await db.query('SELECT providerId FROM service_providers WHERE userId = ?', [userId]);

    if (providers.length === 0) {
      return res.status(404).json({ success: false, message: 'Service provider not found' });
    }

    // Mark as not approved (keep record)
    await db.query('UPDATE service_providers SET isApproved = FALSE WHERE userId = ?', [userId]);

    // Create notification for the provider
    await db.query(
      `INSERT INTO notifications (userId, title, message, type)
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        'Account Not Approved',
        `Your service provider application was not approved. Reason: ${reason}`,
        'error'
      ]
    );

    res.json({ success: true, message: 'Service provider rejected successfully' });
  } catch (error) {
    console.error('Reject provider error:', error);
    next(error);
  }
};

/**
 * Get all users
 * GET /api/admin/users
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { userType, isActive, search } = req.query;

    let query = `
      SELECT
        userId,
        firebaseUid,
        email,
        userType,
        firstName,
        lastName,
        contactNo,
        profileImage,
        gender,
        isActive,
        isVerified,
        createdAt
      FROM users
      WHERE 1=1
    `;

    const params = [];

    if (userType) {
      query += ' AND userType = ?';
      params.push(userType);
    }

    if (isActive !== undefined) {
      query += ' AND isActive = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    if (search) {
      query += ' AND (email LIKE ? OR firstName LIKE ? OR lastName LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY createdAt DESC';

    const [users] = await db.query(query, params);

    res.json({ success: true, data: users, count: users.length });
  } catch (error) {
    console.error('Get all users error:', error);
    next(error);
  }
};

/**
 * Toggle user active status
 * PUT /api/admin/user-status/:userId
 */
exports.toggleUserStatus = async (req, res, next) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { userId } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({ success: false, message: 'isActive field is required' });
    }

    // Check if user exists
    const [users] = await db.query('SELECT userId, email FROM users WHERE userId = ?', [userId]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update user status
    await db.query('UPDATE users SET isActive = ? WHERE userId = ?', [isActive ? 1 : 0, userId]);

    // Create notification
    await db.query(
      `INSERT INTO notifications (userId, title, message, type)
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        isActive ? 'Account Activated' : 'Account Deactivated',
        isActive
          ? 'Your account has been activated by an administrator.'
          : 'Your account has been deactivated by an administrator.',
        isActive ? 'success' : 'warning'
      ]
    );

    res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    console.error('Toggle user status error:', error);
    next(error);
  }
};

/**
 * Get pending locations
 * GET /api/admin/pending-locations
 */
exports.getPendingLocations = async (req, res, next) => {
  try {
    if (!requireAdmin(req, res)) return;

    const [locations] = await db.query(
      `SELECT
        l.locationId,
        l.name,
        l.category,
        l.description,
        l.coordinates,
        l.address,
        l.district,
        l.province,
        l.images,
        l.entryFee,
        l.openingHours,
        l.suggestedBy,
        l.createdAt,
        u.email as suggestedByEmail,
        u.firstName as suggestedByFirstName,
        u.lastName as suggestedByLastName
      FROM locations l
      LEFT JOIN users u ON l.suggestedBy = u.userId
      WHERE l.isApproved = FALSE
      ORDER BY l.createdAt DESC`
    );

    // Parse JSON fields safely
    locations.forEach(loc => {
      try { if (loc.coordinates) loc.coordinates = JSON.parse(loc.coordinates); } catch (e) { loc.coordinates = null; }
      try { if (loc.images) loc.images = JSON.parse(loc.images); } catch (e) { loc.images = []; }
      try { if (loc.openingHours) loc.openingHours = JSON.parse(loc.openingHours); } catch (e) { loc.openingHours = {}; }
    });

    res.json({ success: true, data: locations, count: locations.length });
  } catch (error) {
    console.error('Get pending locations error:', error);
    next(error);
  }
};

/**
 * Approve location
 * POST /api/admin/approve-location/:locationId
 */
exports.approveLocation = async (req, res, next) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { locationId } = req.params;
    const adminUserId = req.user.userId;

    // Check if location exists
    const [locations] = await db.query('SELECT locationId, suggestedBy FROM locations WHERE locationId = ?', [locationId]);

    if (locations.length === 0) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    const location = locations[0];

    // Update approval status
    await db.query(
      `UPDATE locations
       SET isApproved = TRUE, approvedAt = NOW(), approvedBy = ?
       WHERE locationId = ?`,
      [adminUserId, locationId]
    );

    // Create notification for the user who suggested it
    if (location.suggestedBy) {
      await db.query(
        `INSERT INTO notifications (userId, title, message, type, relatedEntityType, relatedEntityId)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          location.suggestedBy,
          'Location Approved',
          'Your suggested location has been approved and is now visible to all users!',
          'success',
          'location',
          locationId
        ]
      );
    }

    res.json({ success: true, message: 'Location approved successfully' });
  } catch (error) {
    console.error('Approve location error:', error);
    next(error);
  }
};

/**
 * Reject location
 * POST /api/admin/reject-location/:locationId
 */
exports.rejectLocation = async (req, res, next) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { locationId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    // Check if location exists
    const [locations] = await db.query('SELECT locationId, suggestedBy FROM locations WHERE locationId = ?', [locationId]);

    if (locations.length === 0) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    const location = locations[0];

    // Delete the location (or you could keep it with a rejected flag)
    await db.query('DELETE FROM locations WHERE locationId = ?', [locationId]);

    // Create notification for the user who suggested it
    if (location.suggestedBy) {
      await db.query(
        `INSERT INTO notifications (userId, title, message, type)
         VALUES (?, ?, ?, ?)`,
        [
          location.suggestedBy,
          'Location Not Approved',
          `Your suggested location was not approved. Reason: ${reason}`,
          'error'
        ]
      );
    }

    res.json({ success: true, message: 'Location rejected successfully' });
  } catch (error) {
    console.error('Reject location error:', error);
    next(error);
  }
};

/**
 * Get approved locations
 * GET /api/admin/approved-locations
 */
exports.getApprovedLocations = async (req, res, next) => {
  try {
    if (!requireAdmin(req, res)) return;

    const [locations] = await db.query(
      `SELECT
        l.locationId,
        l.name,
        l.category,
        l.description,
        l.district,
        l.province,
        l.ratings,
        l.totalReviews,
        l.approvedAt,
        l.createdAt,
        u.email as approvedByEmail,
        u.firstName as approvedByFirstName,
        u.lastName as approvedByLastName
      FROM locations l
      LEFT JOIN users u ON l.approvedBy = u.userId
      WHERE l.isApproved = TRUE
      ORDER BY l.approvedAt DESC`
    );

    res.json({ success: true, data: locations, count: locations.length });
  } catch (error) {
    console.error('Get approved locations error:', error);
    next(error);
  }
};

/**
 * Get rejected locations (if you keep rejected records)
 * GET /api/admin/rejected-locations
 */
exports.getRejectedLocations = async (req, res, next) => {
  try {
    if (!requireAdmin(req, res)) return;

    // Since we delete rejected locations, this will return empty
    // If you want to track rejections, add a 'rejectedAt' field instead of deleting
    res.json({ success: true, data: [], count: 0, message: 'Rejected locations are deleted from the system' });
  } catch (error) {
    console.error('Get rejected locations error:', error);
    next(error);
  }
};

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    if (!requireAdmin(req, res)) return;

    // Get total users by type
    const [userStats] = await db.query(
      `SELECT
        userType,
        COUNT(*) as count,
        SUM(CASE WHEN isActive = TRUE THEN 1 ELSE 0 END) as activeCount
      FROM users
      GROUP BY userType`
    );

    // Get pending approvals
    const [pendingStats] = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM service_providers WHERE isApproved = FALSE) as pendingProviders,
        (SELECT COUNT(*) FROM locations WHERE isApproved = FALSE) as pendingLocations`
    );

    // Get location stats
    const [locationStats] = await db.query(
      `SELECT
        COUNT(*) as totalLocations,
        SUM(CASE WHEN isApproved = TRUE THEN 1 ELSE 0 END) as approvedLocations,
        SUM(CASE WHEN isApproved = FALSE THEN 1 ELSE 0 END) as pendingLocations
      FROM locations`
    );

    // Get recent activity
    const [recentUsers] = await db.query(
      `SELECT COUNT(*) as newUsersToday
       FROM users
       WHERE DATE(createdAt) = CURDATE()`
    );

    res.json({
      success: true,
      data: {
        users: userStats,
        pending: pendingStats[0],
        locations: locationStats[0],
        recentActivity: recentUsers[0]
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    next(error);
  }
};
