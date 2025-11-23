# 🚀 Travelya Backend API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require Firebase authentication. Include the Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

---

## 📑 Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [Destinations APIs](#destinations-apis)
3. [Trip Planning APIs](#trip-planning-apis)
4. [Animal Recognition APIs](#animal-recognition-apis)
5. [Service Provider APIs](#service-provider-apis)
6. [Review APIs](#review-apis)
7. [Booking APIs](#booking-apis)
8. [Travel Journal APIs](#travel-journal-apis)
9. [Emergency/SOS APIs](#emergencysos-apis)
10. [Notification APIs](#notification-apis)

---

## 🔐 Authentication APIs
**Base Path:** `/api/auth`

### Public Endpoints

#### Register User
```http
POST /api/auth/register
```
**Body:**
```json
{
  "firebaseUid": "string",
  "email": "string",
  "userType": "traveler|service_provider|admin",
  "firstName": "string",
  "lastName": "string",
  "contactNo": "string",
  "profileImage": "string",
  "gender": "male|female|other"
}
```

#### Check User Exists
```http
GET /api/auth/check/:firebaseUid
```

### Protected Endpoints (Require Auth)

#### Get Profile
```http
GET /api/auth/profile
```
**Response:** Returns user profile with traveler or provider info based on userType

#### Update Profile
```http
PATCH /api/auth/profile
```
**Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "contactNo": "string",
  "profileImage": "string",
  "gender": "male|female|other"
}
```

#### Update Traveler Info
```http
PATCH /api/auth/traveler-info
```
**Body:**
```json
{
  "passportNo": "string",
  "nicNo": "string",
  "nationality": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "emergencyContact": "string",
  "emergencyContactName": "string"
}
```

#### Delete Account
```http
DELETE /api/auth/account
```

---

## 🗺️ Destinations APIs
**Base Path:** `/api/destinations`

### Public Endpoints

#### Get All Destinations
```http
GET /api/destinations
```
**Query Parameters:**
- `category` - Filter by category (cultural, nature, adventure, beach, historical, wildlife, religious, other)
- `district` - Filter by district
- `province` - Filter by province
- `search` - Search in name and description

#### Get Popular Destinations
```http
GET /api/destinations/popular?limit=10
```

#### Get Nearby Destinations
```http
GET /api/destinations/nearby?lat=6.9271&lng=79.8612&radius=50
```
**Query Parameters:**
- `lat` - Latitude (required)
- `lng` - Longitude (required)
- `radius` - Radius in km (default: 50)

#### Get Destinations by Category
```http
GET /api/destinations/category/:category
```

#### Get Destination by ID
```http
GET /api/destinations/:locationId
```

### Protected Endpoints

#### Suggest New Destination
```http
POST /api/destinations/suggest
```
**Body:**
```json
{
  "name": "string",
  "category": "string",
  "description": "string",
  "coordinates": { "lat": 6.9271, "lng": 79.8612 },
  "address": "string",
  "district": "string",
  "province": "string",
  "images": ["url1", "url2"],
  "entryFee": 100.00,
  "openingHours": { "monday": "8:00-17:00" }
}
```

---

## 🗓️ Trip Planning APIs
**Base Path:** `/api/trips`
**All endpoints require authentication**

#### Generate AI Itinerary
```http
POST /api/trips/generate
```
**Body:**
```json
{
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "budget": 50000.00,
  "numberOfTravelers": 2,
  "preferences": ["cultural", "nature"]
}
```

#### Save Trip Plan
```http
POST /api/trips/save
```
**Body:**
```json
{
  "tripName": "string",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "budget": 50000.00,
  "numberOfTravelers": 2,
  "preferences": ["cultural"],
  "itinerary": {}
}
```

#### Get My Trips
```http
GET /api/trips
```

#### Get Trip by ID
```http
GET /api/trips/:tripId
```

#### Update Trip Status
```http
PATCH /api/trips/:tripId/status
```
**Body:**
```json
{
  "status": "planning|confirmed|ongoing|completed|cancelled"
}
```

#### Delete Trip
```http
DELETE /api/trips/:tripId
```

---

## 🦁 Animal Recognition APIs
**Base Path:** `/api/animals`
**All endpoints require authentication (Traveler only)**

#### Log Recognition
```http
POST /api/animals/recognize
```
**Body:**
```json
{
  "animalName": "string",
  "confidence": 0.95,
  "imageUrl": "string",
  "locationLat": 6.9271,
  "locationLng": 79.8612
}
```

#### Get Recognition History
```http
GET /api/animals/history
```

#### Get Recognition Stats
```http
GET /api/animals/stats
```

#### Get Animal Info
```http
GET /api/animals/info/:animalName
```

#### Delete Recognition
```http
DELETE /api/animals/:recognitionId
```

---

## 🏨 Service Provider APIs
**Base Path:** `/api/service-providers`

### Public Endpoints

#### Get All Providers
```http
GET /api/service-providers
```
**Query Parameters:**
- `providerType` - Filter by type (hotel, guide, taxi, restaurant, other)

#### Get Provider by ID
```http
GET /api/service-providers/:providerId
```

#### Get Providers by Type
```http
GET /api/service-providers/type/:providerType
```

#### Get Nearby Providers
```http
GET /api/service-providers/nearby?lat=6.9271&lng=79.8612&radius=50&providerType=hotel
```

#### Get Provider Packages
```http
GET /api/service-providers/:providerId/packages
```

### Protected Endpoints (Service Provider)

#### Get My Provider Profile
```http
GET /api/service-providers/my-profile
```

#### Update Provider Profile
```http
PATCH /api/service-providers/profile
```
**Body:**
```json
{
  "businessName": "string",
  "providerType": "hotel|guide|taxi|restaurant|other",
  "businessRegistrationNo": "string",
  "description": "string",
  "address": "string",
  "locationLat": 6.9271,
  "locationLng": 79.8612
}
```

#### Create Package
```http
POST /api/service-providers/packages
```
**Body:**
```json
{
  "packageName": "string",
  "description": "string",
  "price": 5000.00,
  "currency": "LKR",
  "duration": "3 days",
  "maxPeople": 4,
  "images": ["url1", "url2"],
  "amenities": ["WiFi", "Breakfast"]
}
```

#### Update Package
```http
PATCH /api/service-providers/packages/:packageId
```

#### Delete Package
```http
DELETE /api/service-providers/packages/:packageId
```

---

## ⭐ Review APIs
**Base Path:** `/api/reviews`

### Public Endpoints

#### Get Reviews by Target
```http
GET /api/reviews/:reviewType/:targetId
```
**Parameters:**
- `reviewType` - "location" or "service_provider"
- `targetId` - ID of location or provider

**Query Parameters:**
- `limit` - Number of reviews (default: 50)
- `offset` - Pagination offset (default: 0)

#### Get Review Statistics
```http
GET /api/reviews/stats/:reviewType/:targetId
```

### Protected Endpoints

#### Create Review
```http
POST /api/reviews
```
**Body:**
```json
{
  "reviewType": "location|service_provider",
  "targetId": 123,
  "rating": 5,
  "comment": "string",
  "images": ["url1", "url2"]
}
```

#### Get My Reviews
```http
GET /api/reviews/my-reviews
```

#### Update Review
```http
PATCH /api/reviews/:reviewId
```

#### Delete Review
```http
DELETE /api/reviews/:reviewId
```

---

## 📅 Booking APIs
**Base Path:** `/api/bookings`
**All endpoints require authentication**

#### Create Booking
```http
POST /api/bookings
```
**Body:**
```json
{
  "providerId": 123,
  "packageId": 456,
  "tripId": 789,
  "requestDate": "YYYY-MM-DD",
  "numberOfPeople": 2,
  "specialRequirements": "string"
}
```

#### Get My Bookings (Traveler)
```http
GET /api/bookings/my-bookings?status=pending
```

#### Get Provider Requests (Provider)
```http
GET /api/bookings/provider-requests?status=pending
```

#### Get Booking by ID
```http
GET /api/bookings/:requestId
```

#### Update Booking Status (Provider)
```http
PATCH /api/bookings/:requestId/status
```
**Body:**
```json
{
  "status": "pending|accepted|rejected|completed|cancelled"
}
```

#### Cancel Booking (Traveler)
```http
PATCH /api/bookings/:requestId/cancel
```

#### Update Payment Status
```http
PATCH /api/bookings/:requestId/payment
```
**Body:**
```json
{
  "isPaid": true,
  "paymentIntentId": "string"
}
```

---

## 📔 Travel Journal APIs
**Base Path:** `/api/journals`

### Public Endpoints

#### Get Public Journals
```http
GET /api/journals/public?limit=20&offset=0&locationId=123
```

### Protected Endpoints (Traveler)

#### Create Journal Entry
```http
POST /api/journals
```
**Body:**
```json
{
  "tripId": 123,
  "title": "string",
  "content": "string",
  "visitDate": "YYYY-MM-DD",
  "locationId": 456,
  "images": ["url1", "url2"],
  "isPublic": true
}
```

#### Get My Journals
```http
GET /api/journals/my-journals?tripId=123
```

#### Get Journal by ID
```http
GET /api/journals/:journalId
```

#### Update Journal
```http
PATCH /api/journals/:journalId
```

#### Delete Journal
```http
DELETE /api/journals/:journalId
```

---

## 🚨 Emergency/SOS APIs
**Base Path:** `/api/emergency`
**All endpoints require authentication**

#### Create Emergency Alert
```http
POST /api/emergency
```
**Body:**
```json
{
  "alertType": "sos|medical|police|other",
  "message": "string",
  "locationLat": 6.9271,
  "locationLng": 79.8612
}
```

#### Get My Alerts
```http
GET /api/emergency/my-alerts?status=active
```

#### Get Active Alerts (Admin)
```http
GET /api/emergency/active-alerts
```

#### Get Alert by ID
```http
GET /api/emergency/:alertId
```

#### Update Alert Status
```http
PATCH /api/emergency/:alertId/status
```
**Body:**
```json
{
  "status": "active|resolved|false_alarm"
}
```

#### Delete Alert
```http
DELETE /api/emergency/:alertId
```

---

## 🔔 Notification APIs
**Base Path:** `/api/notifications`
**All endpoints require authentication**

#### Get My Notifications
```http
GET /api/notifications?isRead=false&limit=50&offset=0
```

#### Get Unread Count
```http
GET /api/notifications/unread-count
```

#### Mark as Read
```http
PATCH /api/notifications/:notificationId/read
```

#### Mark All as Read
```http
PATCH /api/notifications/read-all
```

#### Delete Notification
```http
DELETE /api/notifications/:notificationId
```

#### Delete All Notifications
```http
DELETE /api/notifications/delete-all
```

#### Create Notification (System Use)
```http
POST /api/notifications
```
**Body:**
```json
{
  "userId": 123,
  "title": "string",
  "message": "string",
  "type": "info|warning|success|error",
  "relatedEntityType": "string",
  "relatedEntityId": 123
}
```

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": { },
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error info"
}
```

---

## 🔧 System Endpoints

#### Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "OK",
  "message": "Travelya API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 📝 Notes

### Provider Types
- `hotel` - Hotels and accommodations
- `guide` - Tour guides
- `taxi` - Transportation services
- `restaurant` - Restaurants and food services
- `other` - Other service providers

### Destination Categories
- `cultural` - Cultural sites
- `nature` - Natural attractions
- `adventure` - Adventure activities
- `beach` - Beach destinations
- `historical` - Historical sites
- `wildlife` - Wildlife parks/sanctuaries
- `religious` - Religious sites
- `other` - Other destinations

### User Types
- `traveler` - Regular travelers
- `service_provider` - Service providers (hotels, guides, etc.)
- `admin` - System administrators

### Trip Status
- `planning` - Trip is being planned
- `confirmed` - Trip is confirmed
- `ongoing` - Trip is in progress
- `completed` - Trip is completed
- `cancelled` - Trip is cancelled

### Booking Status
- `pending` - Waiting for provider response
- `accepted` - Provider accepted the booking
- `rejected` - Provider rejected the booking
- `completed` - Booking is completed
- `cancelled` - Booking is cancelled

### Alert Types
- `sos` - General emergency
- `medical` - Medical emergency
- `police` - Police assistance needed
- `other` - Other emergency types

---

## 🚀 Getting Started

1. Start your backend server:
```bash
npm start
```

2. Test the health endpoint:
```bash
curl http://localhost:3000/health
```

3. Register a user via Firebase, then use the API endpoints with the Firebase token.

---

**Last Updated:** 2024
**Version:** 1.0.0
