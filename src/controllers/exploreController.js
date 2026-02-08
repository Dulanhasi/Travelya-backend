const db = require('../config/database');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lon1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lon2 - Second point longitude
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * GET /api/explore/nearby-providers
 * Get service providers near user location using existing locationLat/locationLng columns
 */
exports.getNearbyProviders = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 10, category } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);
    const searchRadius = parseFloat(radius);

    if (isNaN(userLat) || isNaN(userLng) || isNaN(searchRadius)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude, longitude, or radius'
      });
    }

    // Query service providers with JOIN to users table for user-related fields
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
        u.firstName,
        u.lastName,
        u.contactNo,
        u.profileImage,
        u.isVerified
      FROM service_providers sp
      JOIN users u ON sp.userId = u.userId
      WHERE sp.isApproved = 1
        AND sp.locationLat IS NOT NULL
        AND sp.locationLng IS NOT NULL
    `;

    const params = [];

    if (category && category !== 'all') {
      query += ' AND sp.providerType = ?';
      params.push(category);
    }

    const [providers] = await db.query(query, params);

    // Calculate distances and filter by radius
    const providersWithDistance = providers
      .map(provider => {
        if (!provider.locationLat || !provider.locationLng) {
          return null;
        }

        const distance = calculateDistance(
          userLat,
          userLng,
          parseFloat(provider.locationLat),
          parseFloat(provider.locationLng)
        );

        if (distance > searchRadius) {
          return null;
        }

        return {
          providerId: provider.providerId,
          userId: provider.userId,
          businessName: provider.businessName,
          providerType: provider.providerType,
          description: provider.description,
          address: provider.address,
          locationLat: parseFloat(provider.locationLat),
          locationLng: parseFloat(provider.locationLng),
          overallRating: provider.overallRating ? parseFloat(provider.overallRating) : 0,
          totalReviews: provider.totalReviews || 0,
          firstName: provider.firstName,
          lastName: provider.lastName,
          contactNo: provider.contactNo,
          profileImage: provider.profileImage,
          isVerified: provider.isVerified === 1,
          distance: Math.round(distance * 10) / 10
        };
      })
      .filter(p => p !== null)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: providersWithDistance,
      count: providersWithDistance.length
    });

  } catch (error) {
    console.error('Error fetching nearby providers:', error);
    next(error);
  }
};

/**
 * GET /api/explore/nearby-locations
 * Get tourist locations near user location
 */
exports.getNearbyLocations = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 10, category } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);
    const searchRadius = parseFloat(radius);

    if (isNaN(userLat) || isNaN(userLng) || isNaN(searchRadius)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid latitude, longitude, or radius'
      });
    }

    let query = `
      SELECT
        l.locationId,
        l.name,
        l.category,
        l.description,
        l.coordinates,
        l.address,
        l.district,
        l.province,
        l.images,
        l.ratings,
        l.totalReviews,
        l.entryFee,
        l.openingHours
      FROM locations l
      WHERE l.isApproved = 1
        AND l.isActive = 1
        AND l.coordinates IS NOT NULL
    `;

    const params = [];

    if (category && category !== 'all') {
      query += ' AND l.category = ?';
      params.push(category);
    }

    const [locations] = await db.query(query, params);

    // Calculate distances and filter by radius
    const locationsWithDistance = locations
      .map(location => {
        try {
          // Parse JSON coordinates
          const coords = typeof location.coordinates === 'string'
            ? JSON.parse(location.coordinates)
            : location.coordinates;

          if (!coords || !coords.lat || !coords.lng) {
            return null;
          }

          const distance = calculateDistance(
            userLat,
            userLng,
            parseFloat(coords.lat),
            parseFloat(coords.lng)
          );

          if (distance > searchRadius) {
            return null;
          }

          // Parse JSON fields safely
          let images = [];
          try {
            images = typeof location.images === 'string'
              ? JSON.parse(location.images)
              : location.images || [];
          } catch (e) {
            images = [];
          }

          let openingHours = null;
          try {
            openingHours = location.openingHours
              ? (typeof location.openingHours === 'string'
                  ? JSON.parse(location.openingHours)
                  : location.openingHours)
              : null;
          } catch (e) {
            openingHours = null;
          }

          return {
            locationId: location.locationId,
            name: location.name,
            category: location.category,
            description: location.description,
            coordinates: coords,
            address: location.address,
            district: location.district,
            province: location.province,
            images: images,
            ratings: location.ratings ? parseFloat(location.ratings) : 0,
            totalReviews: location.totalReviews || 0,
            entryFee: location.entryFee ? parseFloat(location.entryFee) : null,
            openingHours: openingHours,
            distance: Math.round(distance * 10) / 10
          };
        } catch (error) {
          console.error('Error parsing location data:', error);
          return null;
        }
      })
      .filter(l => l !== null)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: locationsWithDistance,
      count: locationsWithDistance.length
    });

  } catch (error) {
    console.error('Error fetching nearby locations:', error);
    next(error);
  }
};

/**
 * GET /api/explore/search
 * Search for locations and providers
 */
exports.search = async (req, res, next) => {
  try {
    const { query, type, latitude, longitude } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchTerm = `%${query}%`;
    const results = {
      locations: [],
      providers: []
    };

    const userLat = latitude ? parseFloat(latitude) : null;
    const userLng = longitude ? parseFloat(longitude) : null;

    // Search locations
    if (!type || type === 'location') {
      const [locations] = await db.query(`
        SELECT
          locationId, name, category, description, coordinates,
          address, district, province, images, ratings, totalReviews,
          entryFee, openingHours
        FROM locations
        WHERE isApproved = 1 AND isActive = 1
          AND (name LIKE ? OR description LIKE ? OR address LIKE ? OR district LIKE ?)
        LIMIT 20
      `, [searchTerm, searchTerm, searchTerm, searchTerm]);

      results.locations = locations.map(loc => {
        let coords = null;
        try {
          coords = typeof loc.coordinates === 'string'
            ? JSON.parse(loc.coordinates)
            : loc.coordinates;
        } catch (e) {
          coords = null;
        }

        let images = [];
        try {
          images = typeof loc.images === 'string'
            ? JSON.parse(loc.images)
            : loc.images || [];
        } catch (e) {
          images = [];
        }

        let openingHours = null;
        try {
          openingHours = loc.openingHours
            ? (typeof loc.openingHours === 'string' ? JSON.parse(loc.openingHours) : loc.openingHours)
            : null;
        } catch (e) {
          openingHours = null;
        }

        // Calculate distance if user location provided and coords exist
        let distance = null;
        if (userLat && userLng && coords && coords.lat && coords.lng) {
          distance = Math.round(calculateDistance(userLat, userLng, coords.lat, coords.lng) * 10) / 10;
        }

        return {
          locationId: loc.locationId,
          name: loc.name,
          category: loc.category,
          description: loc.description,
          coordinates: coords,
          address: loc.address,
          district: loc.district,
          province: loc.province,
          images: images,
          ratings: loc.ratings ? parseFloat(loc.ratings) : 0,
          totalReviews: loc.totalReviews || 0,
          entryFee: loc.entryFee ? parseFloat(loc.entryFee) : null,
          openingHours: openingHours,
          distance: distance
        };
      });
    }

    // Search providers
    if (!type || type === 'provider') {
      const [providers] = await db.query(`
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
          u.firstName,
          u.lastName,
          u.contactNo,
          u.profileImage,
          u.isVerified
        FROM service_providers sp
        JOIN users u ON sp.userId = u.userId
        WHERE sp.isApproved = 1
          AND (sp.businessName LIKE ? OR sp.description LIKE ? OR sp.address LIKE ?)
        LIMIT 20
      `, [searchTerm, searchTerm, searchTerm]);

      results.providers = providers.map(prov => {
        // Calculate distance if user location provided and provider location exists
        let distance = null;
        if (userLat && userLng && prov.locationLat && prov.locationLng) {
          distance = Math.round(
            calculateDistance(userLat, userLng, parseFloat(prov.locationLat), parseFloat(prov.locationLng)) * 10
          ) / 10;
        }

        return {
          providerId: prov.providerId,
          businessName: prov.businessName,
          providerType: prov.providerType,
          description: prov.description,
          address: prov.address,
          locationLat: prov.locationLat ? parseFloat(prov.locationLat) : null,
          locationLng: prov.locationLng ? parseFloat(prov.locationLng) : null,
          overallRating: prov.overallRating ? parseFloat(prov.overallRating) : 0,
          totalReviews: prov.totalReviews || 0,
          firstName: prov.firstName,
          lastName: prov.lastName,
          contactNo: prov.contactNo,
          profileImage: prov.profileImage,
          isVerified: prov.isVerified === 1,
          distance: distance
        };
      });
    }

    res.json({
      success: true,
      data: results,
      totalCount: results.locations.length + results.providers.length
    });

  } catch (error) {
    console.error('Error searching:', error);
    next(error);
  }
};

/**
 * POST /api/explore/sos
 * Send emergency SOS alert using emergency_alerts table
 */
exports.sendSOS = async (req, res, next) => {
  try {
    const { latitude, longitude, message, alertType = 'sos' } = req.body;

    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location is required for SOS alert'
      });
    }

    const userId = req.user.userId;

    // Get travelerId from userId
    const [travelers] = await db.query(
      'SELECT travelerId FROM travelers WHERE userId = ?',
      [userId]
    );

    if (travelers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Traveler profile not found. Only travelers can send SOS alerts.'
      });
    }

    const travelerId = travelers[0].travelerId;

    // Validate alertType
    const validAlertTypes = ['sos', 'medical', 'police', 'other'];
    const finalAlertType = validAlertTypes.includes(alertType) ? alertType : 'sos';

    // Insert into emergency_alerts table
    const [result] = await db.query(`
      INSERT INTO emergency_alerts (travelerId, alertType, message, locationLat, locationLng, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `, [travelerId, finalAlertType, message || 'Emergency help needed', latitude, longitude]);

    const alertId = result.insertId;

    // TODO: Implement notification system
    // - Send SMS to emergency contacts
    // - Notify nearby authorities
    // - Send push notifications to nearby users
    // - Log to emergency monitoring system

    res.status(201).json({
      success: true,
      message: 'SOS alert sent successfully. Help is on the way!',
      data: {
        alertId: alertId,
        alertType: finalAlertType,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error sending SOS:', error);
    next(error);
  }
};

/**
 * GET /api/explore/provider-categories
 * Get available provider categories
 */
exports.getProviderCategories = async (req, res, next) => {
  try {
    const [categories] = await db.query(`
      SELECT DISTINCT providerType as category
      FROM service_providers
      WHERE isApproved = 1
      ORDER BY providerType
    `);

    res.json({
      success: true,
      data: categories.map(c => c.category)
    });
  } catch (error) {
    console.error('Error fetching provider categories:', error);
    next(error);
  }
};

/**
 * GET /api/explore/location-categories
 * Get available location categories
 */
exports.getLocationCategories = async (req, res, next) => {
  try {
    const [categories] = await db.query(`
      SELECT DISTINCT category
      FROM locations
      WHERE isApproved = 1 AND isActive = 1
      ORDER BY category
    `);

    res.json({
      success: true,
      data: categories.map(c => c.category)
    });
  } catch (error) {
    console.error('Error fetching location categories:', error);
    next(error);
  }
};

module.exports = exports;
