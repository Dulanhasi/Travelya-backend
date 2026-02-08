# Backend API Implementation Guide

This guide provides the complete Node.js/Express backend API implementation for the Explore features.

## Prerequisites

```bash
npm install express mysql2 firebase-admin dotenv
```

## Database Schema

```sql
-- Service Providers Table (should already exist)
-- Add coordinates column if not present
ALTER TABLE service_providers
ADD COLUMN coordinates JSON AFTER workingLocation;

-- Update existing providers with coordinates
UPDATE service_providers
SET coordinates = JSON_OBJECT('lat', 6.9271, 'lng', 79.8612)
WHERE providerId = 1;

-- SOS Alerts Table (new)
CREATE TABLE sos_alerts (
  emergencyId INT PRIMARY KEY AUTO_INCREMENT,
  userId VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  message TEXT,
  status ENUM('pending', 'responded', 'resolved') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolvedAt TIMESTAMP NULL,
  INDEX idx_user (userId),
  INDEX idx_status (status),
  INDEX idx_created (createdAt)
);
```

## API Routes Implementation

### 1. `/api/explore/nearby-providers` (GET)

```javascript
// routes/explore.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in kilometers
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
 * Get service providers near user location
 */
router.get('/nearby-providers', verifyToken, async (req, res) => {
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

    // Build query
    let query = `
      SELECT
        p.providerId,
        p.businessName,
        p.providerType,
        p.firstName,
        p.lastName,
        p.contactNo,
        p.profileImage,
        p.workingLocation,
        p.coordinates,
        p.description,
        p.isVerified,
        p.isAvailable,
        AVG(r.rating) as rating,
        COUNT(r.reviewId) as totalReviews
      FROM service_providers p
      LEFT JOIN provider_reviews r ON p.providerId = r.providerId
      WHERE p.isApproved = 1
        AND p.isActive = 1
        AND p.coordinates IS NOT NULL
    `;

    const params = [];

    if (category && category !== 'all') {
      query += ' AND p.providerType = ?';
      params.push(category);
    }

    query += ' GROUP BY p.providerId';

    const [providers] = await db.execute(query, params);

    // Calculate distances and filter by radius
    const providersWithDistance = providers
      .map(provider => {
        try {
          const coords = typeof provider.coordinates === 'string'
            ? JSON.parse(provider.coordinates)
            : provider.coordinates;

          if (!coords || !coords.lat || !coords.lng) {
            return null;
          }

          const distance = calculateDistance(
            userLat,
            userLng,
            coords.lat,
            coords.lng
          );

          if (distance > searchRadius) {
            return null;
          }

          return {
            ...provider,
            coordinates: coords,
            distance: Math.round(distance * 10) / 10,
            rating: provider.rating ? Math.round(provider.rating * 10) / 10 : null,
          };
        } catch (error) {
          console.error('Error parsing provider coordinates:', error);
          return null;
        }
      })
      .filter(p => p !== null)
      .sort((a, b) => a.distance - b.distance); // Sort by distance

    res.json({
      success: true,
      data: providersWithDistance,
      count: providersWithDistance.length
    });

  } catch (error) {
    console.error('Error fetching nearby providers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby providers',
      error: error.message
    });
  }
});

module.exports = router;
```

### 2. `/api/explore/nearby-locations` (GET)

```javascript
/**
 * GET /api/explore/nearby-locations
 * Get tourist locations near user location
 */
router.get('/nearby-locations', verifyToken, async (req, res) => {
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

    // Build query
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

    const [locations] = await db.execute(query, params);

    // Calculate distances and filter by radius
    const locationsWithDistance = locations
      .map(location => {
        try {
          const coords = typeof location.coordinates === 'string'
            ? JSON.parse(location.coordinates)
            : location.coordinates;

          if (!coords || !coords.lat || !coords.lng) {
            return null;
          }

          const distance = calculateDistance(
            userLat,
            userLng,
            coords.lat,
            coords.lng
          );

          if (distance > searchRadius) {
            return null;
          }

          return {
            ...location,
            coordinates: coords,
            distance: Math.round(distance * 10) / 10,
            images: typeof location.images === 'string'
              ? JSON.parse(location.images)
              : location.images,
            openingHours: location.openingHours
              ? (typeof location.openingHours === 'string'
                  ? JSON.parse(location.openingHours)
                  : location.openingHours)
              : null,
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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby locations',
      error: error.message
    });
  }
});
```

### 3. `/api/explore/search` (GET)

```javascript
/**
 * GET /api/explore/search
 * Search for locations and providers
 */
router.get('/search', verifyToken, async (req, res) => {
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

    // Search locations
    if (!type || type === 'location') {
      const [locations] = await db.execute(`
        SELECT
          locationId, name, category, description, coordinates,
          address, district, province, images, ratings, totalReviews,
          entryFee, openingHours
        FROM locations
        WHERE isApproved = 1 AND isActive = 1
          AND (name LIKE ? OR description LIKE ? OR address LIKE ? OR district LIKE ?)
        LIMIT 20
      `, [searchTerm, searchTerm, searchTerm, searchTerm]);

      results.locations = locations.map(loc => ({
        ...loc,
        coordinates: typeof loc.coordinates === 'string'
          ? JSON.parse(loc.coordinates)
          : loc.coordinates,
        images: typeof loc.images === 'string'
          ? JSON.parse(loc.images)
          : loc.images,
        distance: latitude && longitude && loc.coordinates
          ? calculateDistance(
              parseFloat(latitude),
              parseFloat(longitude),
              JSON.parse(loc.coordinates).lat,
              JSON.parse(loc.coordinates).lng
            )
          : null
      }));
    }

    // Search providers
    if (!type || type === 'provider') {
      const [providers] = await db.execute(`
        SELECT
          p.providerId, p.businessName, p.providerType,
          p.firstName, p.lastName, p.contactNo, p.profileImage,
          p.workingLocation, p.coordinates, p.description,
          AVG(r.rating) as rating, COUNT(r.reviewId) as totalReviews
        FROM service_providers p
        LEFT JOIN provider_reviews r ON p.providerId = r.providerId
        WHERE p.isApproved = 1 AND p.isActive = 1
          AND (p.businessName LIKE ? OR p.description LIKE ? OR p.workingLocation LIKE ?)
        GROUP BY p.providerId
        LIMIT 20
      `, [searchTerm, searchTerm, searchTerm]);

      results.providers = providers.map(prov => ({
        ...prov,
        coordinates: typeof prov.coordinates === 'string'
          ? JSON.parse(prov.coordinates)
          : prov.coordinates,
        rating: prov.rating ? Math.round(prov.rating * 10) / 10 : null,
        distance: latitude && longitude && prov.coordinates
          ? calculateDistance(
              parseFloat(latitude),
              parseFloat(longitude),
              JSON.parse(prov.coordinates).lat,
              JSON.parse(prov.coordinates).lng
            )
          : null
      }));
    }

    res.json({
      success: true,
      data: results,
      totalCount: results.locations.length + results.providers.length
    });

  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});
```

### 4. `/api/explore/sos` (POST)

```javascript
/**
 * POST /api/explore/sos
 * Send emergency SOS alert
 */
router.post('/sos', verifyToken, async (req, res) => {
  try {
    const { latitude, longitude, message } = req.body;
    const userId = req.user.uid;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location is required for SOS alert'
      });
    }

    // Insert SOS alert
    const [result] = await db.execute(`
      INSERT INTO sos_alerts (userId, latitude, longitude, message, status)
      VALUES (?, ?, ?, ?, 'pending')
    `, [userId, latitude, longitude, message || 'Emergency help needed']);

    const emergencyId = result.insertId;

    // TODO: Implement notification system
    // - Send SMS to emergency contacts
    // - Notify nearby authorities
    // - Send push notifications to nearby users
    // - Log to emergency monitoring system

    res.status(201).json({
      success: true,
      message: 'SOS alert sent successfully. Help is on the way!',
      emergencyId: emergencyId,
      data: {
        emergencyId,
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error sending SOS:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send SOS alert',
      error: error.message
    });
  }
});
```

### 5. Category Endpoints

```javascript
/**
 * GET /api/explore/provider-categories
 * Get available provider categories
 */
router.get('/provider-categories', verifyToken, async (req, res) => {
  try {
    const [categories] = await db.execute(`
      SELECT DISTINCT providerType as category
      FROM service_providers
      WHERE isApproved = 1 AND isActive = 1
      ORDER BY providerType
    `);

    res.json({
      success: true,
      data: categories.map(c => c.category)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});

/**
 * GET /api/explore/location-categories
 * Get available location categories
 */
router.get('/location-categories', verifyToken, async (req, res) => {
  try {
    const [categories] = await db.execute(`
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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
});
```

## Main Server Setup

Add to your `server.js` or `app.js`:

```javascript
const exploreRoutes = require('./routes/explore');

// Mount explore routes
app.use('/api/explore', exploreRoutes);
```

## Testing the APIs

### Test Nearby Providers
```bash
curl -X GET "http://localhost:3000/api/explore/nearby-providers?latitude=6.9271&longitude=79.8612&radius=10" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### Test Nearby Locations
```bash
curl -X GET "http://localhost:3000/api/explore/nearby-locations?latitude=6.9271&longitude=79.8612&radius=50&category=historical" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### Test Search
```bash
curl -X GET "http://localhost:3000/api/explore/search?query=galle&type=location" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### Test SOS
```bash
curl -X POST "http://localhost:3000/api/explore/sos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "latitude": 6.9271,
    "longitude": 79.8612,
    "message": "Emergency - need immediate help"
  }'
```

## Sample Data Population

```sql
-- Add coordinates to existing providers
UPDATE service_providers
SET coordinates = JSON_OBJECT('lat', 6.9271, 'lng', 79.8612)
WHERE providerId = 1;

-- Add sample providers with coordinates
INSERT INTO service_providers
  (businessName, providerType, firstName, lastName, contactNo, coordinates, workingLocation, isApproved, isActive)
VALUES
  ('Colombo Beach Hotel', 'hotel', 'John', 'Silva', '+94771234567',
   JSON_OBJECT('lat', 6.9271, 'lng', 79.8612), 'Colombo', 1, 1),
  ('Quick Taxi Service', 'taxi', 'Kamal', 'Fernando', '+94772345678',
   JSON_OBJECT('lat', 6.9350, 'lng', 79.8500), 'Colombo', 1, 1),
  ('Lanka Tour Guide', 'guide', 'Nimal', 'Perera', '+94773456789',
   JSON_OBJECT('lat', 6.9200, 'lng', 79.8700), 'Colombo', 1, 1);
```

## Environment Variables

Add to your `.env` file:

```env
# SOS Configuration
SOS_SMS_API_KEY=your_sms_api_key
EMERGENCY_HOTLINE=1990
EMERGENCY_EMAIL=emergency@travelya.com
```

## Next Steps

1. Implement SMS notifications for SOS alerts
2. Add WebSocket for real-time location updates
3. Implement caching with Redis for better performance
4. Add rate limiting for SOS endpoint to prevent abuse
5. Create admin dashboard to monitor SOS alerts
6. Add geofencing for location-based notifications

## Notes

- The Haversine formula provides accurate distance calculations for short to medium distances
- For production, consider using PostGIS or similar for better geospatial queries
- Implement proper indexing on coordinates fields for better query performance
- Add pagination for search results in production
- Consider implementing a queue system for SOS alerts processing
