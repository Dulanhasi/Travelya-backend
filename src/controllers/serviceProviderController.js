// const db = require('../config/database');

// /**
//  * Get all approved service providers
//  * GET /api/service-providers
//  */
// exports.getAllProviders = async (req, res, next) => {
//   try {
//     const { providerType, isApproved } = req.query;

//     let query = `
//       SELECT
//         sp.providerId,
//         sp.userId,
//         sp.businessName,
//         sp.providerType,
//         sp.description,
//         sp.address,
//         sp.locationLat,
//         sp.locationLng,
//         sp.overallRating,
//         sp.totalReviews,
//         sp.isApproved,
//         u.email,
//         u.contactNo,
//         u.profileImage
//       FROM service_providers sp
//       JOIN users u ON sp.userId = u.userId
//       WHERE 1=1
//     `;

//     const params = [];

//     if (providerType) {
//       query += ' AND sp.providerType = ?';
//       params.push(providerType);
//     }

//     if (isApproved !== undefined) {
//       query += ' AND sp.isApproved = ?';
//       params.push(isApproved === 'true' ? 1 : 0);
//     } else {
//       // By default, only show approved providers to travelers
//       query += ' AND sp.isApproved = TRUE';
//     }

//     query += ' ORDER BY sp.overallRating DESC, sp.totalReviews DESC';

//     const [providers] = await db.query(query, params);

//     res.json({
//       success: true,
//       data: providers,
//       count: providers.length
//     });
//   } catch (error) {
//     console.error('Get service providers error:', error);
//     next(error);
//   }
// };

// /**
//  * Get service provider by ID
//  * GET /api/service-providers/:providerId
//  */
// exports.getProviderById = async (req, res, next) => {
//   try {
//     const { providerId } = req.params;

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
//         sp.overallRating,
//         sp.totalReviews,
//         sp.isApproved,
//         sp.approvedAt,
//         u.email,
//         u.contactNo,
//         u.profileImage,
//         u.firstName,
//         u.lastName
//       FROM service_providers sp
//       JOIN users u ON sp.userId = u.userId
//       WHERE sp.providerId = ?`,
//       [providerId]
//     );

//     if (providers.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Service provider not found'
//       });
//     }

//     const provider = providers[0];

//     // Get packages for this provider
//     const [packages] = await db.query(
//       `SELECT
//         packageId,
//         packageName,
//         description,
//         price,
//         currency,
//         duration,
//         maxPeople,
//         images,
//         amenities,
//         isActive
//       FROM service_packages
//       WHERE providerId = ? AND isActive = TRUE`,
//       [providerId]
//     );

//     // Parse JSON fields
//     packages.forEach(pkg => {
//       if (pkg.images) pkg.images = JSON.parse(pkg.images);
//       if (pkg.amenities) pkg.amenities = JSON.parse(pkg.amenities);
//     });

//     provider.packages = packages;

//     res.json({
//       success: true,
//       data: provider
//     });
//   } catch (error) {
//     console.error('Get provider by ID error:', error);
//     next(error);
//   }
// };

// /**
//  * Get providers by type
//  * GET /api/service-providers/type/:providerType
//  */
// exports.getProvidersByType = async (req, res, next) => {
//   try {
//     const { providerType } = req.params;

//     const [providers] = await db.query(
//       `SELECT
//         sp.providerId,
//         sp.businessName,
//         sp.providerType,
//         sp.description,
//         sp.address,
//         sp.locationLat,
//         sp.locationLng,
//         sp.overallRating,
//         sp.totalReviews,
//         u.contactNo,
//         u.profileImage
//       FROM service_providers sp
//       JOIN users u ON sp.userId = u.userId
//       WHERE sp.providerType = ? AND sp.isApproved = TRUE
//       ORDER BY sp.overallRating DESC`,
//       [providerType]
//     );

//     res.json({
//       success: true,
//       data: providers,
//       count: providers.length
//     });
//   } catch (error) {
//     console.error('Get providers by type error:', error);
//     next(error);
//   }
// };

// /**
//  * Get nearby service providers
//  * GET /api/service-providers/nearby
//  */
// exports.getNearbyProviders = async (req, res, next) => {
//   try {
//     const { lat, lng, radius, providerType } = req.query;

//     if (!lat || !lng) {
//       return res.status(400).json({
//         success: false,
//         message: 'Latitude and longitude are required'
//       });
//     }

//     const radiusInKm = parseFloat(radius) || 50;

//     let query = `
//       SELECT
//         sp.providerId,
//         sp.businessName,
//         sp.providerType,
//         sp.description,
//         sp.address,
//         sp.locationLat,
//         sp.locationLng,
//         sp.overallRating,
//         sp.totalReviews,
//         u.contactNo,
//         u.profileImage,
//         (6371 * acos(cos(radians(?)) * cos(radians(sp.locationLat)) *
//         cos(radians(sp.locationLng) - radians(?)) +
//         sin(radians(?)) * sin(radians(sp.locationLat)))) AS distance
//       FROM service_providers sp
//       JOIN users u ON sp.userId = u.userId
//       WHERE sp.isApproved = TRUE AND sp.locationLat IS NOT NULL AND sp.locationLng IS NOT NULL
//     `;

//     const params = [lat, lng, lat];

//     if (providerType) {
//       query += ' AND sp.providerType = ?';
//       params.push(providerType);
//     }

//     query += ' HAVING distance <= ? ORDER BY distance ASC';
//     params.push(radiusInKm);

//     const [providers] = await db.query(query, params);

//     providers.forEach(provider => {
//       provider.distance = parseFloat(provider.distance).toFixed(2);
//     });

//     res.json({
//       success: true,
//       data: providers,
//       count: providers.length
//     });
//   } catch (error) {
//     console.error('Get nearby providers error:', error);
//     next(error);
//   }
// };

// /**
//  * Update service provider profile
//  * PATCH /api/service-providers/profile
//  */
// exports.updateProviderProfile = async (req, res, next) => {
//   try {
//     const userId = req.user.userId;
//     const {
//       businessName,
//       providerType,
//       businessRegistrationNo,
//       description,
//       address,
//       locationLat,
//       locationLng
//     } = req.body;

//     // Check if user is a service provider
//     const [providers] = await db.query(
//       'SELECT providerId FROM service_providers WHERE userId = ?',
//       [userId]
//     );

//     if (providers.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Service provider profile not found'
//       });
//     }

//     const updateFields = [];
//     const params = [];

//     if (businessName) {
//       updateFields.push('businessName = ?');
//       params.push(businessName);
//     }
//     if (providerType) {
//       updateFields.push('providerType = ?');
//       params.push(providerType);
//     }
//     if (businessRegistrationNo) {
//       updateFields.push('businessRegistrationNo = ?');
//       params.push(businessRegistrationNo);
//     }
//     if (description) {
//       updateFields.push('description = ?');
//       params.push(description);
//     }
//     if (address) {
//       updateFields.push('address = ?');
//       params.push(address);
//     }
//     if (locationLat !== undefined) {
//       updateFields.push('locationLat = ?');
//       params.push(locationLat);
//     }
//     if (locationLng !== undefined) {
//       updateFields.push('locationLng = ?');
//       params.push(locationLng);
//     }

//     if (updateFields.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'No fields to update'
//       });
//     }

//     params.push(userId);

//     await db.query(
//       `UPDATE service_providers SET ${updateFields.join(', ')} WHERE userId = ?`,
//       params
//     );

//     res.json({
//       success: true,
//       message: 'Provider profile updated successfully'
//     });
//   } catch (error) {
//     console.error('Update provider profile error:', error);
//     next(error);
//   }
// };

// /**
//  * Get packages for a provider
//  * GET /api/service-providers/:providerId/packages
//  */
// exports.getProviderPackages = async (req, res, next) => {
//   try {
//     const { providerId } = req.params;

//     const [packages] = await db.query(
//       `SELECT
//         packageId,
//         packageName,
//         description,
//         price,
//         currency,
//         duration,
//         maxPeople,
//         images,
//         amenities,
//         isActive,
//         createdAt
//       FROM service_packages
//       WHERE providerId = ? AND isActive = TRUE
//       ORDER BY createdAt DESC`,
//       [providerId]
//     );

//     // Parse JSON fields
//     packages.forEach(pkg => {
//       if (pkg.images) pkg.images = JSON.parse(pkg.images);
//       if (pkg.amenities) pkg.amenities = JSON.parse(pkg.amenities);
//     });

//     res.json({
//       success: true,
//       data: packages,
//       count: packages.length
//     });
//   } catch (error) {
//     console.error('Get provider packages error:', error);
//     next(error);
//   }
// };

// /**
//  * Create a service package
//  * POST /api/service-providers/packages
//  */
// exports.createPackage = async (req, res, next) => {
//   try {
//     const userId = req.user.userId;
//     const {
//       packageName,
//       description,
//       price,
//       currency,
//       duration,
//       maxPeople,
//       images,
//       amenities
//     } = req.body;

//     if (!packageName || !price) {
//       return res.status(400).json({
//         success: false,
//         message: 'Package name and price are required'
//       });
//     }

//     // Get provider ID
//     const [providers] = await db.query(
//       'SELECT providerId FROM service_providers WHERE userId = ?',
//       [userId]
//     );

//     if (providers.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Service provider profile not found'
//       });
//     }

//     const providerId = providers[0].providerId;

//     const [result] = await db.query(
//       `INSERT INTO service_packages
//       (providerId, packageName, description, price, currency, duration, maxPeople, images, amenities)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         providerId,
//         packageName,
//         description,
//         price,
//         currency || 'LKR',
//         duration,
//         maxPeople,
//         JSON.stringify(images || []),
//         JSON.stringify(amenities || [])
//       ]
//     );

//     res.status(201).json({
//       success: true,
//       message: 'Package created successfully',
//       data: {
//         packageId: result.insertId
//       }
//     });
//   } catch (error) {
//     console.error('Create package error:', error);
//     next(error);
//   }
// };

// /**
//  * Update a service package
//  * PATCH /api/service-providers/packages/:packageId
//  */
// exports.updatePackage = async (req, res, next) => {
//   try {
//     const userId = req.user.userId;
//     const { packageId } = req.params;
//     const {
//       packageName,
//       description,
//       price,
//       currency,
//       duration,
//       maxPeople,
//       images,
//       amenities,
//       isActive
//     } = req.body;

//     // Check ownership
//     const [packages] = await db.query(
//       `SELECT sp.packageId
//       FROM service_packages sp
//       JOIN service_providers p ON sp.providerId = p.providerId
//       WHERE sp.packageId = ? AND p.userId = ?`,
//       [packageId, userId]
//     );

//     if (packages.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Package not found or unauthorized'
//       });
//     }

//     const updateFields = [];
//     const params = [];

//     if (packageName) {
//       updateFields.push('packageName = ?');
//       params.push(packageName);
//     }
//     if (description) {
//       updateFields.push('description = ?');
//       params.push(description);
//     }
//     if (price !== undefined) {
//       updateFields.push('price = ?');
//       params.push(price);
//     }
//     if (currency) {
//       updateFields.push('currency = ?');
//       params.push(currency);
//     }
//     if (duration) {
//       updateFields.push('duration = ?');
//       params.push(duration);
//     }
//     if (maxPeople !== undefined) {
//       updateFields.push('maxPeople = ?');
//       params.push(maxPeople);
//     }
//     if (images) {
//       updateFields.push('images = ?');
//       params.push(JSON.stringify(images));
//     }
//     if (amenities) {
//       updateFields.push('amenities = ?');
//       params.push(JSON.stringify(amenities));
//     }
//     if (isActive !== undefined) {
//       updateFields.push('isActive = ?');
//       params.push(isActive);
//     }

//     if (updateFields.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'No fields to update'
//       });
//     }

//     params.push(packageId);

//     await db.query(
//       `UPDATE service_packages SET ${updateFields.join(', ')} WHERE packageId = ?`,
//       params
//     );

//     res.json({
//       success: true,
//       message: 'Package updated successfully'
//     });
//   } catch (error) {
//     console.error('Update package error:', error);
//     next(error);
//   }
// };

// /**
//  * Delete a service package
//  * DELETE /api/service-providers/packages/:packageId
//  */
// exports.deletePackage = async (req, res, next) => {
//   try {
//     const userId = req.user.userId;
//     const { packageId } = req.params;

//     // Check ownership
//     const [packages] = await db.query(
//       `SELECT sp.packageId
//       FROM service_packages sp
//       JOIN service_providers p ON sp.providerId = p.providerId
//       WHERE sp.packageId = ? AND p.userId = ?`,
//       [packageId, userId]
//     );

//     if (packages.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Package not found or unauthorized'
//       });
//     }

//     await db.query('DELETE FROM service_packages WHERE packageId = ?', [packageId]);

//     res.json({
//       success: true,
//       message: 'Package deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete package error:', error);
//     next(error);
//   }
// };

// /**
//  * Get my provider profile (for logged-in provider)
//  * GET /api/service-providers/my-profile
//  */
// exports.getMyProviderProfile = async (req, res, next) => {
//   try {
//     const userId = req.user.userId;

//     const [providers] = await db.query(
//       `SELECT
//         sp.providerId,
//         sp.businessName,
//         sp.providerType,
//         sp.businessRegistrationNo,
//         sp.description,
//         sp.address,
//         sp.locationLat,
//         sp.locationLng,
//         sp.overallRating,
//         sp.totalReviews,
//         sp.isApproved,
//         sp.approvedAt,
//         u.email,
//         u.contactNo,
//         u.profileImage,
//         u.firstName,
//         u.lastName
//       FROM service_providers sp
//       JOIN users u ON sp.userId = u.userId
//       WHERE sp.userId = ?`,
//       [userId]
//     );

//     if (providers.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Service provider profile not found'
//       });
//     }

//     const provider = providers[0];

//     // Get my packages
//     const [packages] = await db.query(
//       `SELECT
//         packageId,
//         packageName,
//         description,
//         price,
//         currency,
//         duration,
//         maxPeople,
//         images,
//         amenities,
//         isActive,
//         createdAt
//       FROM service_packages
//       WHERE providerId = ?
//       ORDER BY createdAt DESC`,
//       [provider.providerId]
//     );

//     packages.forEach(pkg => {
//       if (pkg.images) pkg.images = JSON.parse(pkg.images);
//       if (pkg.amenities) pkg.amenities = JSON.parse(pkg.amenities);
//     });

//     provider.packages = packages;

//     res.json({
//       success: true,
//       data: provider
//     });
//   } catch (error) {
//     console.error('Get my provider profile error:', error);
//     next(error);
//   }
// };


// controllers/serviceProviderController.js
const db = require('../config/database');

/**
 * Get all approved service providers
 * GET /api/service-providers
 * Query params:
 *   - providerType
 *   - isApproved (optional: 'true'|'false')
 */
exports.getAllProviders = async (req, res, next) => {
  try {
    const { providerType, isApproved } = req.query;

    let query = `
      SELECT
        sp.providerId,
        sp.userId,
        sp.businessName,
        sp.providerType,
        sp.description,
        sp.address,
        sp.locationLat,
        sp.locationLng,
        sp.overallRating,
        sp.totalReviews,
        sp.isApproved,
        u.email,
        u.contactNo,
        u.profileImage
      FROM service_providers sp
      JOIN users u ON sp.userId = u.userId
      WHERE 1=1
    `;

    const params = [];

    if (providerType) {
      query += ' AND sp.providerType = ?';
      params.push(providerType);
    }

    if (isApproved !== undefined) {
      // Accept 'true'|'false' strings or boolean-like values
      const approvedFlag = (isApproved === 'true' || isApproved === true || isApproved === '1' || isApproved === 1) ? 1 : 0;
      query += ' AND sp.isApproved = ?';
      params.push(approvedFlag);
    } else {
      // By default, only show approved providers to public users
      query += ' AND sp.isApproved = TRUE';
    }

    query += ' ORDER BY sp.overallRating DESC, sp.totalReviews DESC';

    const [providers] = await db.query(query, params);

    res.json({
      success: true,
      data: providers,
      count: providers.length
    });
  } catch (error) {
    console.error('Get service providers error:', error);
    next(error);
  }
};

/**
 * Get service provider by ID
 * GET /api/service-providers/:providerId
 */
exports.getProviderById = async (req, res, next) => {
  try {
    const { providerId } = req.params;

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
        sp.overallRating,
        sp.totalReviews,
        sp.isApproved,
        sp.approvedAt,
        u.email,
        u.contactNo,
        u.profileImage,
        u.firstName,
        u.lastName
      FROM service_providers sp
      JOIN users u ON sp.userId = u.userId
      WHERE sp.providerId = ?`,
      [providerId]
    );

    if (providers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service provider not found'
      });
    }

    const provider = providers[0];

    // Get packages for this provider
    const [packages] = await db.query(
      `SELECT
        packageId,
        packageName,
        description,
        price,
        currency,
        duration,
        maxPeople,
        images,
        amenities,
        isActive
      FROM service_packages
      WHERE providerId = ? AND isActive = TRUE`,
      [providerId]
    );

    // Parse JSON fields safely
    packages.forEach(pkg => {
      try { if (pkg.images) pkg.images = JSON.parse(pkg.images); } catch (e) { pkg.images = []; }
      try { if (pkg.amenities) pkg.amenities = JSON.parse(pkg.amenities); } catch (e) { pkg.amenities = []; }
    });

    provider.packages = packages;

    res.json({
      success: true,
      data: provider
    });
  } catch (error) {
    console.error('Get provider by ID error:', error);
    next(error);
  }
};

/**
 * Get providers by type
 * GET /api/service-providers/type/:providerType
 */
exports.getProvidersByType = async (req, res, next) => {
  try {
    const { providerType } = req.params;

    const [providers] = await db.query(
      `SELECT
        sp.providerId,
        sp.businessName,
        sp.providerType,
        sp.description,
        sp.address,
        sp.locationLat,
        sp.locationLng,
        sp.overallRating,
        sp.totalReviews,
        u.contactNo,
        u.profileImage
      FROM service_providers sp
      JOIN users u ON sp.userId = u.userId
      WHERE sp.providerType = ? AND sp.isApproved = TRUE
      ORDER BY sp.overallRating DESC`,
      [providerType]
    );

    res.json({
      success: true,
      data: providers,
      count: providers.length
    });
  } catch (error) {
    console.error('Get providers by type error:', error);
    next(error);
  }
};

/**
 * Get nearby service providers
 * GET /api/service-providers/nearby
 */
exports.getNearbyProviders = async (req, res, next) => {
  try {
    const { lat, lng, radius, providerType } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const radiusInKm = parseFloat(radius) || 50;

    let query = `
      SELECT
        sp.providerId,
        sp.businessName,
        sp.providerType,
        sp.description,
        sp.address,
        sp.locationLat,
        sp.locationLng,
        sp.overallRating,
        sp.totalReviews,
        u.contactNo,
        u.profileImage,
        (6371 * acos(cos(radians(?)) * cos(radians(sp.locationLat)) *
        cos(radians(sp.locationLng) - radians(?)) +
        sin(radians(?)) * sin(radians(sp.locationLat)))) AS distance
      FROM service_providers sp
      JOIN users u ON sp.userId = u.userId
      WHERE sp.isApproved = TRUE AND sp.locationLat IS NOT NULL AND sp.locationLng IS NOT NULL
    `;

    const params = [lat, lng, lat];

    if (providerType) {
      query += ' AND sp.providerType = ?';
      params.push(providerType);
    }

    query += ' HAVING distance <= ? ORDER BY distance ASC';
    params.push(radiusInKm);

    const [providers] = await db.query(query, params);

    providers.forEach(provider => {
      provider.distance = parseFloat(provider.distance).toFixed(2);
    });

    res.json({
      success: true,
      data: providers,
      count: providers.length
    });
  } catch (error) {
    console.error('Get nearby providers error:', error);
    next(error);
  }
};

/**
 * Update service provider profile
 * PATCH /api/service-providers/profile
 * (Requires authenticated provider)
 */
exports.updateProviderProfile = async (req, res, next) => {
  try {
    // Ensure authenticated
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, message: 'Authenticated user required' });
    }

    const userId = req.user.userId;
    const {
      businessName,
      providerType,
      businessRegistrationNo,
      description,
      address,
      locationLat,
      locationLng,
      profileImage,
      phone
    } = req.body;

    // Check if user is a service provider
    const [providers] = await db.query(
      'SELECT providerId FROM service_providers WHERE userId = ?',
      [userId]
    );

    if (providers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service provider profile not found'
      });
    }

    const updateFields = [];
    const params = [];

    if (businessName) {
      updateFields.push('businessName = ?');
      params.push(businessName);
    }
    if (providerType) {
      updateFields.push('providerType = ?');
      params.push(providerType);
    }
    if (businessRegistrationNo) {
      updateFields.push('businessRegistrationNo = ?');
      params.push(businessRegistrationNo);
    }
    if (description) {
      updateFields.push('description = ?');
      params.push(description);
    }
    if (address) {
      updateFields.push('address = ?');
      params.push(address);
    }
    if (locationLat !== undefined) {
      updateFields.push('locationLat = ?');
      params.push(locationLat);
    }
    if (locationLng !== undefined) {
      updateFields.push('locationLng = ?');
      params.push(locationLng);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(userId);

    // await db.query(
    //   `UPDATE service_providers SET ${updateFields.join(', ')} WHERE userId = ?`,
    //   params
    // );

    // Update profile image in users table
    if (profileImage) {
      await db.query(
        'UPDATE users SET profileImage = ? WHERE userId = ?',
        [profileImage, userId]
      );
    }

    // Update phone number in users table
    if (phone) {
      await db.query(
        'UPDATE users SET contactNo = ? WHERE userId = ?',
        [phone, userId]
      );
    }

    res.json({
      success: true,
      message: 'Provider profile updated successfully'
    });
  } catch (error) {
    console.error('Update provider profile error:', error);
    next(error);
  }
};

/**
 * Get packages for a provider
 * GET /api/service-providers/:providerId/packages
 */
exports.getProviderPackages = async (req, res, next) => {
  try {
    const { providerId } = req.params;

    const [packages] = await db.query(
      `SELECT
        packageId,
        packageName,
        description,
        price,
        currency,
        duration,
        maxPeople,
        images,
        amenities,
        isActive,
        createdAt
      FROM service_packages
      WHERE providerId = ? AND isActive = TRUE
      ORDER BY createdAt DESC`,
      [providerId]
    );

    // Parse JSON fields safely
    packages.forEach(pkg => {
      try { if (pkg.images) pkg.images = JSON.parse(pkg.images); } catch (e) { pkg.images = []; }
      try { if (pkg.amenities) pkg.amenities = JSON.parse(pkg.amenities); } catch (e) { pkg.amenities = []; }
    });

    res.json({
      success: true,
      data: packages,
      count: packages.length
    });
  } catch (error) {
    console.error('Get provider packages error:', error);
    next(error);
  }
};

/**
 * Create a service package
 * POST /api/service-providers/packages
 * (Requires authenticated provider)
 */
exports.createPackage = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, message: 'Authenticated user required' });
    }

    const userId = req.user.userId;
    const {
      packageName,
      description,
      price,
      currency,
      duration,
      maxPeople,
      images,
      amenities
    } = req.body;

    if (!packageName || price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        message: 'Package name and price are required'
      });
    }

    // Prefer providerId attached by middleware if present
    let providerId = req.user.providerId;
    if (!providerId) {
      const [providers] = await db.query(
        'SELECT providerId FROM service_providers WHERE userId = ?',
        [userId]
      );

      if (providers.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service provider profile not found'
        });
      }

      providerId = providers[0].providerId;
    }

    const [result] = await db.query(
      `INSERT INTO service_packages
      (providerId, packageName, description, price, currency, duration, maxPeople, images, amenities)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        providerId,
        packageName,
        description,
        price,
        currency || 'LKR',
        duration,
        maxPeople,
        JSON.stringify(images || []),
        JSON.stringify(amenities || [])
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: {
        packageId: result.insertId
      }
    });
  } catch (error) {
    console.error('Create package error:', error);
    next(error);
  }
};

/**
 * Update a service package
 * PATCH /api/service-providers/packages/:packageId
 */
exports.updatePackage = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, message: 'Authenticated user required' });
    }

    const userId = req.user.userId;
    const { packageId } = req.params;
    const {
      packageName,
      description,
      price,
      currency,
      duration,
      maxPeople,
      images,
      amenities,
      isActive
    } = req.body;

    // Check ownership
    const [packages] = await db.query(
      `SELECT sp.packageId
      FROM service_packages sp
      JOIN service_providers p ON sp.providerId = p.providerId
      WHERE sp.packageId = ? AND p.userId = ?`,
      [packageId, userId]
    );

    if (packages.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Package not found or unauthorized'
      });
    }

    const updateFields = [];
    const params = [];

    if (packageName) {
      updateFields.push('packageName = ?');
      params.push(packageName);
    }
    if (description) {
      updateFields.push('description = ?');
      params.push(description);
    }
    if (price !== undefined) {
      updateFields.push('price = ?');
      params.push(price);
    }
    if (currency) {
      updateFields.push('currency = ?');
      params.push(currency);
    }
    if (duration !== undefined) {
      updateFields.push('duration = ?');
      params.push(duration);
    }
    if (maxPeople !== undefined) {
      updateFields.push('maxPeople = ?');
      params.push(maxPeople);
    }
    if (images !== undefined) {
      updateFields.push('images = ?');
      params.push(JSON.stringify(images));
    }
    if (amenities !== undefined) {
      updateFields.push('amenities = ?');
      params.push(JSON.stringify(amenities));
    }
    if (isActive !== undefined) {
      updateFields.push('isActive = ?');
      params.push(isActive);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(packageId);

    await db.query(
      `UPDATE service_packages SET ${updateFields.join(', ')} WHERE packageId = ?`,
      params
    );

    res.json({
      success: true,
      message: 'Package updated successfully'
    });
  } catch (error) {
    console.error('Update package error:', error);
    next(error);
  }
};

/**
 * Delete a service package
 * DELETE /api/service-providers/packages/:packageId
 */
exports.deletePackage = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, message: 'Authenticated user required' });
    }

    const userId = req.user.userId;
    const { packageId } = req.params;

    // Check ownership
    const [packages] = await db.query(
      `SELECT sp.packageId
      FROM service_packages sp
      JOIN service_providers p ON sp.providerId = p.providerId
      WHERE sp.packageId = ? AND p.userId = ?`,
      [packageId, userId]
    );

    if (packages.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Package not found or unauthorized'
      });
    }

    await db.query('DELETE FROM service_packages WHERE packageId = ?', [packageId]);

    res.json({
      success: true,
      message: 'Package deleted successfully'
    });
  } catch (error) {
    console.error('Delete package error:', error);
    next(error);
  }
};

/**
 * Get my provider profile (for logged-in provider)
 * GET /api/service-providers/my-profile
 */
exports.getMyProviderProfile = async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ success: false, message: 'Authenticated user required' });
    }

    const userId = req.user.userId;

    const [providers] = await db.query(
      `SELECT
        sp.providerId,
        sp.businessName,
        sp.providerType,
        sp.businessRegistrationNo,
        sp.description,
        sp.address,
        sp.locationLat,
        sp.locationLng,
        sp.overallRating,
        sp.totalReviews,
        sp.isApproved,
        sp.approvedAt,
        u.email,
        u.contactNo,
        u.profileImage,
        u.firstName,
        u.lastName
      FROM service_providers sp
      JOIN users u ON sp.userId = u.userId
      WHERE sp.userId = ?`,
      [userId]
    );

    if (providers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service provider profile not found'
      });
    }

    const provider = providers[0];

    // Get my packages
    const [packages] = await db.query(
      `SELECT
        packageId,
        packageName,
        description,
        price,
        currency,
        duration,
        maxPeople,
        images,
        amenities,
        isActive,
        createdAt
      FROM service_packages
      WHERE providerId = ?
      ORDER BY createdAt DESC`,
      [provider.providerId]
    );

    packages.forEach(pkg => {
      try { if (pkg.images) pkg.images = JSON.parse(pkg.images); } catch (e) { pkg.images = []; }
      try { if (pkg.amenities) pkg.amenities = JSON.parse(pkg.amenities); } catch (e) { pkg.amenities = []; }
    });

    provider.packages = packages;

    res.json({
      success: true,
      data: provider
    });
  } catch (error) {
    console.error('Get my provider profile error:', error);
    next(error);
  }
};

