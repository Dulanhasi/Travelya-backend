# 👑 Admin API Documentation

## Base URL
```
http://your-server:3000/api/admin
```

## Authentication
All admin endpoints require:
1. **Firebase Authentication Token** in Authorization header
2. **Admin user role** - Only users with `userType = 'admin'` can access

```
Authorization: Bearer <firebase-id-token>
```

---

## 📊 Dashboard Statistics

### Get Dashboard Stats
```http
GET /api/admin/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "userType": "traveler",
        "count": 150,
        "activeCount": 145
      },
      {
        "userType": "service_provider",
        "count": 30,
        "activeCount": 25
      },
      {
        "userType": "admin",
        "count": 2,
        "activeCount": 2
      }
    ],
    "pending": {
      "pendingProviders": 5,
      "pendingLocations": 3
    },
    "locations": {
      "totalLocations": 100,
      "approvedLocations": 97,
      "pendingLocations": 3
    },
    "recentActivity": {
      "newUsersToday": 12
    }
  }
}
```

---

## 👥 User Management

### Get All Users
```http
GET /api/admin/users
```

**Query Parameters:**
- `userType` - Filter by user type (traveler, service_provider, admin)
- `isActive` - Filter by status (true/false)
- `search` - Search in email, firstName, lastName

**Example:**
```http
GET /api/admin/users?userType=traveler&isActive=true&search=john
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": 1,
      "firebaseUid": "abc123",
      "email": "john@example.com",
      "userType": "traveler",
      "firstName": "John",
      "lastName": "Doe",
      "contactNo": "+94771234567",
      "profileImage": "https://...",
      "gender": "male",
      "isActive": true,
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Toggle User Status
```http
PUT /api/admin/user-status/:userId
```

**Request Body:**
```json
{
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "User activated successfully"
}
```

**Note:** This also creates a notification for the user

---

## 🏨 Service Provider Management

### Get Pending Service Providers
```http
GET /api/admin/pending-providers
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "providerId": 1,
      "userId": 5,
      "businessName": "Luxury Hotel Colombo",
      "providerType": "hotel",
      "businessRegistrationNo": "BRN123456",
      "description": "5-star hotel in Colombo",
      "address": "123 Main St, Colombo",
      "locationLat": 6.9271,
      "locationLng": 79.8612,
      "isApproved": false,
      "email": "hotel@example.com",
      "firstName": "Hotel",
      "lastName": "Owner",
      "contactNo": "+94771234567",
      "profileImage": "https://...",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Approve Service Provider
```http
POST /api/admin/approve-provider/:userId
```

**Example:**
```http
POST /api/admin/approve-provider/5
```

**Response:**
```json
{
  "success": true,
  "message": "Service provider approved successfully"
}
```

**What happens:**
- Sets `isApproved = TRUE`
- Records `approvedAt` timestamp
- Records admin who approved (`approvedBy`)
- Sends notification to the provider

### Reject Service Provider
```http
POST /api/admin/reject-provider/:userId
```

**Request Body:**
```json
{
  "reason": "Business registration documents are invalid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Service provider rejected successfully"
}
```

**What happens:**
- Sets `isApproved = FALSE`
- Sends notification to provider with rejection reason

---

## 📍 Location Management

### Get Pending Locations
```http
GET /api/admin/pending-locations
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "locationId": 10,
      "name": "Sigiriya Rock Fortress",
      "category": "historical",
      "description": "Ancient rock fortress and palace ruins",
      "coordinates": {
        "lat": 7.9570,
        "lng": 80.7603
      },
      "address": "Sigiriya, Matale District",
      "district": "Matale",
      "province": "Central Province",
      "images": [
        "https://example.com/image1.jpg"
      ],
      "entryFee": 5000.00,
      "openingHours": {
        "monday": "7:00-17:30",
        "tuesday": "7:00-17:30"
      },
      "suggestedBy": 3,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "suggestedByEmail": "user@example.com",
      "suggestedByFirstName": "John",
      "suggestedByLastName": "Doe"
    }
  ],
  "count": 1
}
```

### Approve Location
```http
POST /api/admin/approve-location/:locationId
```

**Example:**
```http
POST /api/admin/approve-location/10
```

**Response:**
```json
{
  "success": true,
  "message": "Location approved successfully"
}
```

**What happens:**
- Sets `isApproved = TRUE`
- Records `approvedAt` timestamp
- Records admin who approved (`approvedBy`)
- Sends notification to user who suggested it (if any)
- Location becomes visible to all users

### Reject Location
```http
POST /api/admin/reject-location/:locationId
```

**Request Body:**
```json
{
  "reason": "Location already exists in the database"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location rejected successfully"
}
```

**What happens:**
- **Deletes the location** from database
- Sends notification to user who suggested it with rejection reason

### Get Approved Locations
```http
GET /api/admin/approved-locations
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "locationId": 1,
      "name": "Galle Fort",
      "category": "historical",
      "description": "Historic fort in Galle",
      "district": "Galle",
      "province": "Southern Province",
      "ratings": 4.5,
      "totalReviews": 150,
      "approvedAt": "2024-01-05T10:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "approvedByEmail": "admin@travelya.lk",
      "approvedByFirstName": "Admin",
      "approvedByLastName": "User"
    }
  ],
  "count": 1
}
```

### Get Rejected Locations
```http
GET /api/admin/rejected-locations
```

**Note:** Currently returns empty array as rejected locations are deleted. If you want to track rejections, modify the `rejectLocation` controller to add a `rejectedAt` field instead of deleting.

**Response:**
```json
{
  "success": true,
  "data": [],
  "count": 0,
  "message": "Rejected locations are deleted from the system"
}
```

---

## 🔒 Authorization & Security

### Admin Role Check
All endpoints use `checkRole(['admin'])` middleware which:
1. Verifies Firebase token
2. Checks user exists in database
3. Verifies `userType = 'admin'`

**Error Response (Non-admin user):**
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions."
}
```

**Status Code:** `403 Forbidden`

### Creating Admin Users
To create an admin user, insert directly into database:

```sql
-- First create the user via Firebase, then:
INSERT INTO users (firebaseUid, email, userType, firstName, lastName, isVerified)
VALUES ('admin-firebase-uid', 'admin@travelya.lk', 'admin', 'Admin', 'User', TRUE);
```

---

## 📱 Flutter Integration Examples

### API Service Class for Admin

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';

class AdminApiService {
  static const String baseUrl = 'http://10.197.43.50:3000/api/admin';

  static Future<Map<String, String>> _getHeaders() async {
    final token = await FirebaseAuth.instance.currentUser?.getIdToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // Get Dashboard Stats
  static Future<Map<String, dynamic>> getDashboardStats() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/stats'),
      headers: headers,
    );

    final data = json.decode(response.body);
    if (response.statusCode == 200 && data['success']) {
      return data['data'];
    }
    throw Exception(data['message'] ?? 'Failed to load stats');
  }

  // Get Pending Providers
  static Future<List<dynamic>> getPendingProviders() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/pending-providers'),
      headers: headers,
    );

    final data = json.decode(response.body);
    if (response.statusCode == 200 && data['success']) {
      return data['data'];
    }
    throw Exception(data['message'] ?? 'Failed to load providers');
  }

  // Approve Provider
  static Future<bool> approveProvider(int userId) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/approve-provider/$userId'),
      headers: headers,
    );

    final data = json.decode(response.body);
    return response.statusCode == 200 && data['success'];
  }

  // Reject Provider
  static Future<bool> rejectProvider(int userId, String reason) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/reject-provider/$userId'),
      headers: headers,
      body: json.encode({'reason': reason}),
    );

    final data = json.decode(response.body);
    return response.statusCode == 200 && data['success'];
  }

  // Get All Users
  static Future<List<dynamic>> getAllUsers({
    String? userType,
    bool? isActive,
    String? search,
  }) async {
    final headers = await _getHeaders();

    String url = '$baseUrl/users?';
    if (userType != null) url += 'userType=$userType&';
    if (isActive != null) url += 'isActive=$isActive&';
    if (search != null) url += 'search=$search&';

    final response = await http.get(
      Uri.parse(url),
      headers: headers,
    );

    final data = json.decode(response.body);
    if (response.statusCode == 200 && data['success']) {
      return data['data'];
    }
    throw Exception(data['message'] ?? 'Failed to load users');
  }

  // Toggle User Status
  static Future<bool> toggleUserStatus(int userId, bool isActive) async {
    final headers = await _getHeaders();
    final response = await http.put(
      Uri.parse('$baseUrl/user-status/$userId'),
      headers: headers,
      body: json.encode({'isActive': isActive}),
    );

    final data = json.decode(response.body);
    return response.statusCode == 200 && data['success'];
  }

  // Get Pending Locations
  static Future<List<dynamic>> getPendingLocations() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/pending-locations'),
      headers: headers,
    );

    final data = json.decode(response.body);
    if (response.statusCode == 200 && data['success']) {
      return data['data'];
    }
    throw Exception(data['message'] ?? 'Failed to load locations');
  }

  // Approve Location
  static Future<bool> approveLocation(int locationId) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/approve-location/$locationId'),
      headers: headers,
    );

    final data = json.decode(response.body);
    return response.statusCode == 200 && data['success'];
  }

  // Reject Location
  static Future<bool> rejectLocation(int locationId, String reason) async {
    final headers = await _getHeaders();
    final response = await http.post(
      Uri.parse('$baseUrl/reject-location/$locationId'),
      headers: headers,
      body: json.encode({'reason': reason}),
    );

    final data = json.decode(response.body);
    return response.statusCode == 200 && data['success'];
  }

  // Get Approved Locations
  static Future<List<dynamic>> getApprovedLocations() async {
    final headers = await _getHeaders();
    final response = await http.get(
      Uri.parse('$baseUrl/approved-locations'),
      headers: headers,
    );

    final data = json.decode(response.body);
    if (response.statusCode == 200 && data['success']) {
      return data['data'];
    }
    throw Exception(data['message'] ?? 'Failed to load locations');
  }
}
```

### Usage Example

```dart
// In your admin dashboard
class AdminDashboard extends StatefulWidget {
  @override
  _AdminDashboardState createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  Map<String, dynamic>? stats;
  List<dynamic> pendingProviders = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    try {
      setState(() => isLoading = true);

      final statsData = await AdminApiService.getDashboardStats();
      final providersData = await AdminApiService.getPendingProviders();

      setState(() {
        stats = statsData;
        pendingProviders = providersData;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  Future<void> approveProvider(int userId) async {
    try {
      final success = await AdminApiService.approveProvider(userId);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Provider approved successfully')),
        );
        loadData(); // Reload data
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      appBar: AppBar(title: Text('Admin Dashboard')),
      body: ListView(
        children: [
          // Display stats
          if (stats != null) ...[
            Text('Pending Providers: ${stats!['pending']['pendingProviders']}'),
            Text('Pending Locations: ${stats!['pending']['pendingLocations']}'),
          ],

          // Display pending providers
          ...pendingProviders.map((provider) => ListTile(
            title: Text(provider['businessName']),
            subtitle: Text(provider['email']),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: Icon(Icons.check, color: Colors.green),
                  onPressed: () => approveProvider(provider['userId']),
                ),
                IconButton(
                  icon: Icon(Icons.close, color: Colors.red),
                  onPressed: () => showRejectDialog(provider['userId']),
                ),
              ],
            ),
          )).toList(),
        ],
      ),
    );
  }
}
```

---

## 🧪 Testing with cURL

### Get Dashboard Stats
```bash
curl -X GET http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer YOUR_ADMIN_FIREBASE_TOKEN"
```

### Get Pending Providers
```bash
curl -X GET http://localhost:3000/api/admin/pending-providers \
  -H "Authorization: Bearer YOUR_ADMIN_FIREBASE_TOKEN"
```

### Approve Provider
```bash
curl -X POST http://localhost:3000/api/admin/approve-provider/5 \
  -H "Authorization: Bearer YOUR_ADMIN_FIREBASE_TOKEN"
```

### Reject Provider
```bash
curl -X POST http://localhost:3000/api/admin/reject-provider/5 \
  -H "Authorization: Bearer YOUR_ADMIN_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Invalid business registration"}'
```

---

## ⚠️ Important Notes

1. **Authorization Required:** All endpoints require admin role
2. **Notifications:** Approval/rejection actions automatically send notifications to affected users
3. **Deletion:** Rejected locations are permanently deleted
4. **Audit Trail:** Approvals record who approved and when
5. **Status Updates:** User status changes notify the affected user

---

## 🎯 API Endpoint Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/stats` | GET | Dashboard statistics |
| `/api/admin/pending-providers` | GET | Pending service providers |
| `/api/admin/approve-provider/:userId` | POST | Approve provider |
| `/api/admin/reject-provider/:userId` | POST | Reject provider with reason |
| `/api/admin/users` | GET | Get all users with filters |
| `/api/admin/user-status/:userId` | PUT | Toggle user active status |
| `/api/admin/pending-locations` | GET | Pending locations |
| `/api/admin/approve-location/:locationId` | POST | Approve location |
| `/api/admin/reject-location/:locationId` | POST | Reject location with reason |
| `/api/admin/approved-locations` | GET | Approved locations |
| `/api/admin/rejected-locations` | GET | Rejected locations |

---

**Ready to integrate with your Flutter mobile app!** 🚀

For complete API documentation of all endpoints, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
