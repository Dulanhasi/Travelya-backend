const db = require('../config/database');

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

    // Parse JSON fields
    destinations.forEach(dest => {
      if (dest.coordinates) dest.coordinates = JSON.parse(dest.coordinates);
      if (dest.images) dest.images = JSON.parse(dest.images);
      if (dest.openingHours) dest.openingHours = JSON.parse(dest.openingHours);
    });

    res.json({
      success: true,
      data: destinations,
      count: destinations.length
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
        message: 'Destination not found'
      });
    }

    const destination = destinations[0];

    // Parse JSON fields
    if (destination.coordinates) destination.coordinates = JSON.parse(destination.coordinates);
    if (destination.images) destination.images = JSON.parse(destination.images);
    if (destination.openingHours) destination.openingHours = JSON.parse(destination.openingHours);

    res.json({
      success: true,
      data: destination
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
    destinations.forEach(dest => {
      if (dest.coordinates) dest.coordinates = JSON.parse(dest.coordinates);
      if (dest.images) dest.images = JSON.parse(dest.images);
    });

    res.json({
      success: true,
      data: destinations
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
    destinations.forEach(dest => {
      if (dest.coordinates) dest.coordinates = JSON.parse(dest.coordinates);
      if (dest.images) dest.images = JSON.parse(dest.images);
    });

    res.json({
      success: true,
      data: destinations,
      count: destinations.length
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
    const userId = req.user.userId;
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
      openingHours
    } = req.body;

    if (!name || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name, category, and description are required'
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
        userId
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Destination suggestion submitted for approval',
      data: {
        locationId: result.insertId
      }
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
        message: 'Latitude and longitude are required'
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
    destinations.forEach(dest => {
      if (dest.coordinates) dest.coordinates = JSON.parse(dest.coordinates);
      if (dest.images) dest.images = JSON.parse(dest.images);
      dest.distance = parseFloat(dest.distance).toFixed(2); // Distance in km
    });

    res.json({
      success: true,
      data: destinations,
      count: destinations.length
    });
  } catch (error) {
    console.error('Get nearby destinations error:', error);
    next(error);
  }
};
