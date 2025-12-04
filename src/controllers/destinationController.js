// const db = require('../config/database');

// /**
//  * Get all approved destinations
//  * GET /api/destinations
//  */
// exports.getAllDestinations = async (req, res, next) => {
//   try {
//     const { category, district, province, search } = req.query;

//     let query = `
//       SELECT
//         locationId,
//         name,
//         category,
//         description,
//         coordinates,
//         address,
//         district,
//         province,
//         images,
//         ratings,
//         totalReviews,
//         entryFee,
//         openingHours
//       FROM locations
//       WHERE isApproved = TRUE
//     `;

//     const params = [];

//     if (category) {
//       query += ' AND category = ?';
//       params.push(category);
//     }

//     if (district) {
//       query += ' AND district = ?';
//       params.push(district);
//     }

//     if (province) {
//       query += ' AND province = ?';
//       params.push(province);
//     }

//     if (search) {
//       query += ' AND (name LIKE ? OR description LIKE ?)';
//       params.push(`%${search}%`, `%${search}%`);
//     }

//     query += ' ORDER BY ratings DESC, totalReviews DESC';

//     const [destinations] = await db.query(query, params);

//     // Parse JSON fields
//     destinations.forEach(dest => {
//       if (dest.coordinates) dest.coordinates = JSON.parse(dest.coordinates);
//       if (dest.images) dest.images = JSON.parse(dest.images);
//       if (dest.openingHours) dest.openingHours = JSON.parse(dest.openingHours);
//     });

//     res.json({
//       success: true,
//       data: destinations,
//       count: destinations.length
//     });
//   } catch (error) {
//     console.error('Get destinations error:', error);
//     next(error);
//   }
// };

// /**
//  * Get destination by ID
//  * GET /api/destinations/:locationId
//  */
// exports.getDestinationById = async (req, res, next) => {
//   try {
//     const { locationId } = req.params;

//     const [destinations] = await db.query(
//       `SELECT
//         locationId,
//         name,
//         category,
//         description,
//         coordinates,
//         address,
//         district,
//         province,
//         images,
//         ratings,
//         totalReviews,
//         entryFee,
//         openingHours,
//         createdAt
//       FROM locations
//       WHERE locationId = ? AND isApproved = TRUE`,
//       [locationId]
//     );

//     if (destinations.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Destination not found'
//       });
//     }

//     const destination = destinations[0];

//     // Parse JSON fields
//     if (destination.coordinates) destination.coordinates = JSON.parse(destination.coordinates);
//     if (destination.images) destination.images = JSON.parse(destination.images);
//     if (destination.openingHours) destination.openingHours = JSON.parse(destination.openingHours);

//     res.json({
//       success: true,
//       data: destination
//     });
//   } catch (error) {
//     console.error('Get destination by ID error:', error);
//     next(error);
//   }
// };

// /**
//  * Get popular destinations
//  * GET /api/destinations/popular
//  */
// exports.getPopularDestinations = async (req, res, next) => {
//   try {
//     const limit = parseInt(req.query.limit) || 10;

//     const [destinations] = await db.query(
//       `SELECT
//         locationId,
//         name,
//         category,
//         description,
//         coordinates,
//         address,
//         district,
//         province,
//         images,
//         ratings,
//         totalReviews,
//         entryFee
//       FROM locations
//       WHERE isApproved = TRUE
//       ORDER BY ratings DESC, totalReviews DESC
//       LIMIT ?`,
//       [limit]
//     );

//     // Parse JSON fields
//     destinations.forEach(dest => {
//       if (dest.coordinates) dest.coordinates = JSON.parse(dest.coordinates);
//       if (dest.images) dest.images = JSON.parse(dest.images);
//     });

//     res.json({
//       success: true,
//       data: destinations
//     });
//   } catch (error) {
//     console.error('Get popular destinations error:', error);
//     next(error);
//   }
// };

// /**
//  * Get destinations by category
//  * GET /api/destinations/category/:category
//  */
// exports.getDestinationsByCategory = async (req, res, next) => {
//   try {
//     const { category } = req.params;

//     const [destinations] = await db.query(
//       `SELECT
//         locationId,
//         name,
//         category,
//         description,
//         coordinates,
//         images,
//         district,
//         ratings,
//         totalReviews
//       FROM locations
//       WHERE category = ? AND isApproved = TRUE
//       ORDER BY ratings DESC`,
//       [category]
//     );

//     // Parse JSON fields
//     destinations.forEach(dest => {
//       if (dest.coordinates) dest.coordinates = JSON.parse(dest.coordinates);
//       if (dest.images) dest.images = JSON.parse(dest.images);
//     });

//     res.json({
//       success: true,
//       data: destinations,
//       count: destinations.length
//     });
//   } catch (error) {
//     console.error('Get destinations by category error:', error);
//     next(error);
//   }
// };

// /**
//  * Suggest a new destination
//  * POST /api/destinations/suggest
//  */
// exports.suggestDestination = async (req, res, next) => {
//   try {
//     const userId = req.user.userId;
//     const {
//       name,
//       category,
//       description,
//       coordinates,
//       address,
//       district,
//       province,
//       images,
//       entryFee,
//       openingHours
//     } = req.body;

//     if (!name || !category || !description) {
//       return res.status(400).json({
//         success: false,
//         message: 'Name, category, and description are required'
//       });
//     }

//     const [result] = await db.query(
//       `INSERT INTO locations
//       (name, category, description, coordinates, address, district, province, images, entryFee, openingHours, suggestedBy, isApproved)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
//       [
//         name,
//         category,
//         description,
//         JSON.stringify(coordinates),
//         address,
//         district,
//         province,
//         JSON.stringify(images || []),
//         entryFee,
//         JSON.stringify(openingHours),
//         userId
//       ]
//     );

//     res.status(201).json({
//       success: true,
//       message: 'Destination suggestion submitted for approval',
//       data: {
//         locationId: result.insertId
//       }
//     });
//   } catch (error) {
//     console.error('Suggest destination error:', error);
//     next(error);
//   }
// };

// /**
//  * Get destinations by location (nearby)
//  * GET /api/destinations/nearby
//  */
// exports.getNearbyDestinations = async (req, res, next) => {
//   try {
//     const { lat, lng, radius } = req.query;

//     if (!lat || !lng) {
//       return res.status(400).json({
//         success: false,
//         message: 'Latitude and longitude are required'
//       });
//     }

//     const radiusInKm = parseFloat(radius) || 50; // Default 50km

//     const [destinations] = await db.query(
//       `SELECT
//         locationId,
//         name,
//         category,
//         description,
//         coordinates,
//         address,
//         district,
//         images,
//         ratings,
//         totalReviews,
//         entryFee,
//         (6371 * acos(cos(radians(?)) * cos(radians(JSON_EXTRACT(coordinates, '$.lat'))) *
//         cos(radians(JSON_EXTRACT(coordinates, '$.lng')) - radians(?)) +
//         sin(radians(?)) * sin(radians(JSON_EXTRACT(coordinates, '$.lat'))))) AS distance
//       FROM locations
//       WHERE isApproved = TRUE AND coordinates IS NOT NULL
//       HAVING distance <= ?
//       ORDER BY distance ASC`,
//       [lat, lng, lat, radiusInKm]
//     );

//     // Parse JSON fields
//     destinations.forEach(dest => {
//       if (dest.coordinates) dest.coordinates = JSON.parse(dest.coordinates);
//       if (dest.images) dest.images = JSON.parse(dest.images);
//       dest.distance = parseFloat(dest.distance).toFixed(2); // Distance in km
//     });

//     res.json({
//       success: true,
//       data: destinations,
//       count: destinations.length
//     });
//   } catch (error) {
//     console.error('Get nearby destinations error:', error);
//     next(error);
//   }
// };

// /**
//  * Get my submitted destinations
//  * GET /api/destinations/my-submissions
//  */
// exports.getMySubmissions = async (req, res, next) => {
//   try {
//     const userId = req.user.userId;

//     const [locations] = await db.query(
//       `SELECT
//         l.*,
//         approver.email as approvedByEmail,
//         approver.firstName as approvedByFirstName,
//         approver.lastName as approvedByLastName
//       FROM locations l
//       LEFT JOIN users approver ON l.approvedBy = approver.userId
//       WHERE l.suggestedBy = ?
//       ORDER BY l.createdAt DESC`,
//       [userId]
//     );

//     // Parse JSON fields and group by status
//     const pending = [];
//     const approved = [];
//     const rejected = [];

//     locations.forEach(loc => {
//       if (loc.coordinates) loc.coordinates = JSON.parse(loc.coordinates);
//       if (loc.images) loc.images = JSON.parse(loc.images);
//       if (loc.openingHours) loc.openingHours = JSON.parse(loc.openingHours);

//       if (loc.isApproved) {
//         approved.push(loc);
//       } else {
//         pending.push(loc);
//       }
//     });

//     res.json({
//       success: true,
//       data: {
//         pending,
//         approved,
//         rejected
//       },
//       count: {
//         pending: pending.length,
//         approved: approved.length,
//         rejected: rejected.length,
//         total: locations.length
//       }
//     });
//   } catch (error) {
//     console.error('Get my submissions error:', error);
//     next(error);
//   }
// };

// /**
//  * Update own pending destination
//  * PUT /api/destinations/:locationId
//  */
// exports.updateMyDestination = async (req, res, next) => {
//   try {
//     const { locationId } = req.params;
//     const userId = req.user.userId;

//     // Check if location exists and belongs to user
//     const [locations] = await db.query(
//       'SELECT * FROM locations WHERE locationId = ? AND suggestedBy = ?',
//       [locationId, userId]
//     );

//     if (locations.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Location not found or you do not have permission to edit'
//       });
//     }

//     const location = locations[0];

//     // Only allow editing if pending (not approved)
//     if (location.isApproved) {
//       return res.status(400).json({
//         success: false,
//         message: 'Cannot edit approved locations'
//       });
//     }

//     const {
//       name,
//       category,
//       description,
//       coordinates,
//       address,
//       district,
//       province,
//       images,
//       entryFee,
//       openingHours
//     } = req.body;

//     const updateFields = [];
//     const params = [];

//     if (name) {
//       updateFields.push('name = ?');
//       params.push(name);
//     }
//     if (category) {
//       updateFields.push('category = ?');
//       params.push(category);
//     }
//     if (description) {
//       updateFields.push('description = ?');
//       params.push(description);
//     }
//     if (coordinates) {
//       updateFields.push('coordinates = ?');
//       params.push(JSON.stringify(coordinates));
//     }
//     if (address) {
//       updateFields.push('address = ?');
//       params.push(address);
//     }
//     if (district !== undefined) {
//       updateFields.push('district = ?');
//       params.push(district);
//     }
//     if (province !== undefined) {
//       updateFields.push('province = ?');
//       params.push(province);
//     }
//     if (images !== undefined) {
//       updateFields.push('images = ?');
//       params.push(JSON.stringify(images));
//     }
//     if (entryFee !== undefined) {
//       updateFields.push('entryFee = ?');
//       params.push(entryFee);
//     }
//     if (openingHours !== undefined) {
//       updateFields.push('openingHours = ?');
//       params.push(JSON.stringify(openingHours));
//     }

//     if (updateFields.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'No fields to update'
//       });
//     }

//     params.push(locationId);

//     await db.query(
//       `UPDATE locations SET ${updateFields.join(', ')} WHERE locationId = ?`,
//       params
//     );

//     res.json({
//       success: true,
//       message: 'Location updated successfully'
//     });
//   } catch (error) {
//     console.error('Update destination error:', error);
//     next(error);
//   }
// };

// /**
//  * Delete own pending destination
//  * DELETE /api/destinations/:locationId
//  */
// exports.deleteMyDestination = async (req, res, next) => {
//   try {
//     const { locationId } = req.params;
//     const userId = req.user.userId;

//     // Check if location exists and belongs to user
//     const [locations] = await db.query(
//       'SELECT * FROM locations WHERE locationId = ? AND suggestedBy = ?',
//       [locationId, userId]
//     );

//     if (locations.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Location not found or you do not have permission to delete'
//       });
//     }

//     const location = locations[0];

//     // Only allow deleting if pending (not approved)
//     if (location.isApproved) {
//       return res.status(400).json({
//         success: false,
//         message: 'Cannot delete approved locations'
//       });
//     }

//     await db.query('DELETE FROM locations WHERE locationId = ?', [locationId]);

//     res.json({
//       success: true,
//       message: 'Location deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete destination error:', error);
//     next(error);
//   }
// };

// controllers/destinationController.js
const db = require('../config/database');

/**
 * Create a new destination (admin adds -> auto-approve)
 * POST /api/destinations
 */
exports.createDestination = async (req, res, next) => {
  try {
    // req.user is set by authenticateUser middleware
    const userId = req.user?.userId || null;
    const userType = req.user?.userType || null;
    const isAdmin = (req.user?.isAdmin === true) || (userType && userType.toString().toLowerCase() === 'admin');

    const {
      name,
      category,
      description,
      coordinates,
      address,
      district,
      province,
      images,
      entryFee,
      openingHours,
    } = req.body;

    if (!name || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name, category and description are required',
      });
    }

    // Decide approval based on admin flag
    const approvedFlag = isAdmin ? 1 : 0;

    const [result] = await db.query(
      `INSERT INTO locations
        (name, category, description, coordinates, address, district, province, images, entryFee, openingHours, suggestedBy, isApproved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        category,
        description,
        coordinates ? JSON.stringify(coordinates) : null,
        address || null,
        district || null,
        province || null,
        JSON.stringify(images || []),
        (entryFee !== undefined && entryFee !== null) ? entryFee : null,
        JSON.stringify(openingHours || {}),
        userId,
        approvedFlag,
      ]
    );

    const newId = result.insertId;

    // Fetch created row for consistent response
    const [rows] = await db.query(
      `SELECT locationId, name, category, description, coordinates, address, district, province, images, ratings, totalReviews, entryFee, openingHours, isApproved, suggestedBy FROM locations WHERE locationId = ?`,
      [newId]
    );

    const created = rows[0];
    if (created) {
      try { if (created.coordinates) created.coordinates = JSON.parse(created.coordinates); } catch (e) { created.coordinates = null; }
      try { if (created.images) created.images = JSON.parse(created.images); } catch (e) { created.images = []; }
      try { if (created.openingHours) created.openingHours = JSON.parse(created.openingHours); } catch (e) { created.openingHours = {}; }
    }

    return res.status(201).json({
      success: true,
      message: approvedFlag ? 'Destination created and approved' : 'Destination created (pending approval)',
      data: created || { locationId: newId },
    });
  } catch (error) {
    console.error('Create destination error:', error);
    next(error);
  }
};

/**
 * Get all approved destinations
 * GET /api/destinations
 */
exports.getAllDestinations = async (req, res, next) => {
  try {
    const { category, district, province, search } = req.query;

    let query = `
      SELECT
        locationId,
        name,
        category,
        description,
        coordinates,
        address,
        district,
        province,
        images,
        ratings,
        totalReviews,
        entryFee,
        openingHours
      FROM locations
      WHERE isApproved = TRUE
    `;

    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (district) {
      query += ' AND district = ?';
      params.push(district);
    }

    if (province) {
      query += ' AND province = ?';
      params.push(province);
    }

    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY ratings DESC, totalReviews DESC';

    const [destinations] = await db.query(query, params);

    // Parse JSON fields safely
    destinations.forEach((dest) => {
      try { if (dest.coordinates) dest.coordinates = JSON.parse(dest.coordinates); } catch (e) { dest.coordinates = null; }
      try { if (dest.images) dest.images = JSON.parse(dest.images); } catch (e) { dest.images = []; }
      try { if (dest.openingHours) dest.openingHours = JSON.parse(dest.openingHours); } catch (e) { dest.openingHours = {}; }
    });

    res.json({
      success: true,
      data: destinations,
      count: destinations.length,
    });
  } catch (error) {
    console.error('Get destinations error:', error);
    next(error);
  }
};

/**
 * Get destination by ID
 * GET /api/destinations/:locationId
 */
exports.getDestinationById = async (req, res, next) => {
  try {
    const { locationId } = req.params;

    const [destinations] = await db.query(
      `SELECT
        locationId,
        name,
        category,
        description,
        coordinates,
        address,
        district,
        province,
        images,
        ratings,
        totalReviews,
        entryFee,
        openingHours,
        createdAt
      FROM locations
      WHERE locationId = ? AND isApproved = TRUE`,
      [locationId]
    );

    if (destinations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found',
      });
    }

    const destination = destinations[0];

    // Parse JSON fields
    try { if (destination.coordinates) destination.coordinates = JSON.parse(destination.coordinates); } catch (e) { destination.coordinates = null; }
    try { if (destination.images) destination.images = JSON.parse(destination.images); } catch (e) { destination.images = []; }
    try { if (destination.openingHours) destination.openingHours = JSON.parse(destination.openingHours); } catch (e) { destination.openingHours = {}; }

    res.json({
      success: true,
      data: destination,
    });
  } catch (error) {
    console.error('Get destination by ID error:', error);
    next(error);
  }
};

/**
 * Get popular destinations
 * GET /api/destinations/popular
 */
exports.getPopularDestinations = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const [destinations] = await db.query(
      `SELECT
        locationId,
        name,
        category,
        description,
        coordinates,
        address,
        district,
        province,
        images,
        ratings,
        totalReviews,
        entryFee
      FROM locations
      WHERE isApproved = TRUE
      ORDER BY ratings DESC, totalReviews DESC
      LIMIT ?`,
      [limit]
    );

    // Parse JSON fields
    destinations.forEach((dest) => {
      try { if (dest.coordinates) dest.coordinates = JSON.parse(dest.coordinates); } catch (e) { dest.coordinates = null; }
      try { if (dest.images) dest.images = JSON.parse(dest.images); } catch (e) { dest.images = []; }
    });

    res.json({
      success: true,
      data: destinations,
    });
  } catch (error) {
    console.error('Get popular destinations error:', error);
    next(error);
  }
};

/**
 * Get destinations by category
 * GET /api/destinations/category/:category
 */
exports.getDestinationsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;

    const [destinations] = await db.query(
      `SELECT
        locationId,
        name,
        category,
        description,
        coordinates,
        images,
        district,
        ratings,
        totalReviews
      FROM locations
      WHERE category = ? AND isApproved = TRUE
      ORDER BY ratings DESC`,
      [category]
    );

    // Parse JSON fields
    destinations.forEach((dest) => {
      try { if (dest.coordinates) dest.coordinates = JSON.parse(dest.coordinates); } catch (e) { dest.coordinates = null; }
      try { if (dest.images) dest.images = JSON.parse(dest.images); } catch (e) { dest.images = []; }
    });

    res.json({
      success: true,
      data: destinations,
      count: destinations.length,
    });
  } catch (error) {
    console.error('Get destinations by category error:', error);
    next(error);
  }
};

/**
 * Suggest a new destination
 * POST /api/destinations/suggest
 */
exports.suggestDestination = async (req, res, next) => {
  try {
    const userId = req.user?.userId || null;
    const {
      name,
      category,
      description,
      coordinates,
      address,
      district,
      province,
      images,
      entryFee,
      openingHours,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated user required',
      });
    }

    if (!name || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, and description are required',
      });
    }

    const [result] = await db.query(
      `INSERT INTO locations
      (name, category, description, coordinates, address, district, province, images, entryFee, openingHours, suggestedBy, isApproved)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
      [
        name,
        category,
        description,
        JSON.stringify(coordinates),
        address,
        district,
        province,
        JSON.stringify(images || []),
        entryFee,
        JSON.stringify(openingHours),
        userId,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Destination suggestion submitted for approval',
      data: {
        locationId: result.insertId,
      },
    });
  } catch (error) {
    console.error('Suggest destination error:', error);
    next(error);
  }
};

/**
 * Get destinations by location (nearby)
 * GET /api/destinations/nearby
 */
exports.getNearbyDestinations = async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required',
      });
    }

    const radiusInKm = parseFloat(radius) || 50; // Default 50km

    const [destinations] = await db.query(
      `SELECT
        locationId,
        name,
        category,
        description,
        coordinates,
        address,
        district,
        images,
        ratings,
        totalReviews,
        entryFee,
        (6371 * acos(cos(radians(?)) * cos(radians(JSON_EXTRACT(coordinates, '$.lat'))) *
        cos(radians(JSON_EXTRACT(coordinates, '$.lng')) - radians(?)) +
        sin(radians(?)) * sin(radians(JSON_EXTRACT(coordinates, '$.lat'))))) AS distance
      FROM locations
      WHERE isApproved = TRUE AND coordinates IS NOT NULL
      HAVING distance <= ?
      ORDER BY distance ASC`,
      [lat, lng, lat, radiusInKm]
    );

    // Parse JSON fields
    destinations.forEach((dest) => {
      try { if (dest.coordinates) dest.coordinates = JSON.parse(dest.coordinates); } catch (e) { dest.coordinates = null; }
      try { if (dest.images) dest.images = JSON.parse(dest.images); } catch (e) { dest.images = []; }
      dest.distance = parseFloat(dest.distance).toFixed(2); // Distance in km
    });

    res.json({
      success: true,
      data: destinations,
      count: destinations.length,
    });
  } catch (error) {
    console.error('Get nearby destinations error:', error);
    next(error);
  }
};

/**
 * Get my submitted destinations
 * GET /api/destinations/my-submissions
 */
exports.getMySubmissions = async (req, res, next) => {
  try {
    const userId = req.user?.userId || null;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authenticated user required',
      });
    }

    const [locations] = await db.query(
      `SELECT
        l.*,
        approver.email as approvedByEmail,
        approver.firstName as approvedByFirstName,
        approver.lastName as approvedByLastName
      FROM locations l
      LEFT JOIN users approver ON l.approvedBy = approver.userId
      WHERE l.suggestedBy = ?
      ORDER BY l.createdAt DESC`,
      [userId]
    );

    // Parse JSON fields and group by status
    const pending = [];
    const approved = [];
    const rejected = [];

    locations.forEach((loc) => {
      try { if (loc.coordinates) loc.coordinates = JSON.parse(loc.coordinates); } catch (e) { loc.coordinates = null; }
      try { if (loc.images) loc.images = JSON.parse(loc.images); } catch (e) { loc.images = []; }
      try { if (loc.openingHours) loc.openingHours = JSON.parse(loc.openingHours); } catch (e) { loc.openingHours = {}; }

      if (loc.isApproved) {
        approved.push(loc);
      } else {
        pending.push(loc);
      }
    });

    res.json({
      success: true,
      data: {
        pending,
        approved,
        rejected,
      },
      count: {
        pending: pending.length,
        approved: approved.length,
        rejected: rejected.length,
        total: locations.length,
      },
    });
  } catch (error) {
    console.error('Get my submissions error:', error);
    next(error);
  }
};

/**
 * Update own pending destination
 * PUT /api/destinations/:locationId
 */
exports.updateMyDestination = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    const userId = req.user?.userId || null;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authenticated user required' });
    }

    // Check if location exists and belongs to user
    const [locations] = await db.query(
      'SELECT * FROM locations WHERE locationId = ? AND suggestedBy = ?',
      [locationId, userId]
    );

    if (locations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Location not found or you do not have permission to edit',
      });
    }

    const location = locations[0];

    // Only allow editing if pending (not approved)
    if (location.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit approved locations',
      });
    }

    const {
      name,
      category,
      description,
      coordinates,
      address,
      district,
      province,
      images,
      entryFee,
      openingHours,
    } = req.body;

    const updateFields = [];
    const params = [];

    if (name) {
      updateFields.push('name = ?');
      params.push(name);
    }
    if (category) {
      updateFields.push('category = ?');
      params.push(category);
    }
    if (description) {
      updateFields.push('description = ?');
      params.push(description);
    }
    if (coordinates) {
      updateFields.push('coordinates = ?');
      params.push(JSON.stringify(coordinates));
    }
    if (address) {
      updateFields.push('address = ?');
      params.push(address);
    }
    if (district !== undefined) {
      updateFields.push('district = ?');
      params.push(district);
    }
    if (province !== undefined) {
      updateFields.push('province = ?');
      params.push(province);
    }
    if (images !== undefined) {
      updateFields.push('images = ?');
      params.push(JSON.stringify(images));
    }
    if (entryFee !== undefined) {
      updateFields.push('entryFee = ?');
      params.push(entryFee);
    }
    if (openingHours !== undefined) {
      updateFields.push('openingHours = ?');
      params.push(JSON.stringify(openingHours));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    params.push(locationId);

    await db.query(
      `UPDATE locations SET ${updateFields.join(', ')} WHERE locationId = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Location updated successfully',
    });
  } catch (error) {
    console.error('Update destination error:', error);
    next(error);
  }
};

/**
 * Delete own pending destination
 * DELETE /api/destinations/:locationId
 */
exports.deleteMyDestination = async (req, res, next) => {
  try {
    const { locationId } = req.params;
    const userId = req.user?.userId || null;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authenticated user required' });
    }

    // Check if location exists and belongs to user
    const [locations] = await db.query(
      'SELECT * FROM locations WHERE locationId = ? AND suggestedBy = ?',
      [locationId, userId]
    );

    if (locations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Location not found or you do not have permission to delete',
      });
    }

    const location = locations[0];

    // Only allow deleting if pending (not approved)
    if (location.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete approved locations',
      });
    }

    await db.query('DELETE FROM locations WHERE locationId = ?', [locationId]);

    res.json({
      success: true,
      message: 'Location deleted successfully',
    });
  } catch (error) {
    console.error('Delete destination error:', error);
    next(error);
  }
};
