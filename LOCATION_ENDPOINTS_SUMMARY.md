# 📍 Location/Destination Endpoints Summary

## ✅ **What You HAVE Now:**

### **Public Endpoints (No Authentication Required)**

1. **GET `/api/destinations`** - Get all approved destinations
   - Query params: `category`, `district`, `province`, `search`
   - Returns only approved locations

2. **GET `/api/destinations/:locationId`** - Get single destination by ID
   - Returns only if approved

3. **GET `/api/destinations/popular`** - Get popular destinations
   - Query param: `limit` (default: 10)
   - Sorted by ratings and reviews

4. **GET `/api/destinations/nearby`** - Get nearby destinations
   - Query params: `lat`, `lng`, `radius` (default: 50km)
   - Returns locations within radius

5. **GET `/api/destinations/category/:category`** - Get destinations by category
   - Categories: cultural, nature, adventure, beach, historical, wildlife, religious, other

---

### **Authenticated User Endpoints (Require Login)**

6. **POST `/api/destinations/suggest`** - Suggest new destination
   - Creates location with `isApproved = FALSE`
   - Goes to admin approval queue
   - Required fields: `name`, `category`, `description`
   - Optional: `coordinates`, `address`, `district`, `province`, `images`, `entryFee`, `openingHours`

7. **GET `/api/destinations/my-submissions`** - Get my submitted destinations ✨ **NEW**
   - Returns user's own submissions grouped by status:
     - `pending` - Waiting for admin approval
     - `approved` - Approved by admin
     - `rejected` - Currently empty (rejections are deleted)

8. **PUT `/api/destinations/:locationId`** - Update own pending destination ✨ **NEW**
   - Can only update if location is pending (not approved)
   - Can only update own locations
   - All fields optional (updates only what's provided)

9. **DELETE `/api/destinations/:locationId`** - Delete own pending destination ✨ **NEW**
   - Can only delete if location is pending (not approved)
   - Can only delete own locations

---

### **Admin-Only Endpoints**

10. **GET `/api/admin/pending-locations`** - Get all pending locations
11. **POST `/api/admin/approve-location/:locationId`** - Approve location
12. **POST `/api/admin/reject-location/:locationId`** - Reject location (deletes it)
13. **GET `/api/admin/approved-locations`** - Get all approved locations
14. **GET `/api/admin/rejected-locations`** - Get rejected locations (currently empty)

---

## 🔄 **Current Workflow:**

### **For Travelers/Regular Users:**
```
1. User submits location → POST /api/destinations/suggest
   ↓
2. Location created with isApproved = FALSE
   ↓
3. User can view their submission → GET /api/destinations/my-submissions
   ↓
4. User can edit while pending → PUT /api/destinations/:locationId
   ↓
5. User can delete while pending → DELETE /api/destinations/:locationId
   ↓
6. Admin reviews → GET /api/admin/pending-locations
   ↓
7a. Admin approves → POST /api/admin/approve-location/:locationId
    → Location becomes visible to all users

7b. Admin rejects → POST /api/admin/reject-location/:locationId
    → Location is deleted
```

### **For Admins:**
```
Admins currently CANNOT directly create pre-approved locations.
They must go through the same suggest → approve flow.

If you want admins to create instant-approved locations,
we can add: POST /api/admin/locations
```

---

## 📱 **Flutter Integration Examples:**

### **Suggest a Location**
```dart
static Future<int> suggestLocation({
  required String name,
  required String category,
  required String description,
  Map<String, double>? coordinates,
  String? address,
  String? district,
  String? province,
  List<String>? images,
  double? entryFee,
  Map<String, String>? openingHours,
}) async {
  final headers = await _getHeaders();

  final response = await http.post(
    Uri.parse('$baseUrl/destinations/suggest'),
    headers: headers,
    body: json.encode({
      'name': name,
      'category': category,
      'description': description,
      'coordinates': coordinates,
      'address': address,
      'district': district,
      'province': province,
      'images': images,
      'entryFee': entryFee,
      'openingHours': openingHours,
    }),
  );

  final data = json.decode(response.body);
  if (response.statusCode == 201 && data['success']) {
    return data['data']['locationId'];
  }
  throw Exception(data['message'] ?? 'Failed to suggest location');
}
```

### **Get My Submissions**
```dart
static Future<Map<String, dynamic>> getMySubmissions() async {
  final headers = await _getHeaders();

  final response = await http.get(
    Uri.parse('$baseUrl/destinations/my-submissions'),
    headers: headers,
  );

  final data = json.decode(response.body);
  if (response.statusCode == 200 && data['success']) {
    return data['data']; // {pending: [], approved: [], rejected: []}
  }
  throw Exception(data['message'] ?? 'Failed to load submissions');
}
```

### **Update Pending Location**
```dart
static Future<bool> updateLocation(int locationId, Map<String, dynamic> updates) async {
  final headers = await _getHeaders();

  final response = await http.put(
    Uri.parse('$baseUrl/destinations/$locationId'),
    headers: headers,
    body: json.encode(updates),
  );

  final data = json.decode(response.body);
  return response.statusCode == 200 && data['success'];
}
```

### **Delete Pending Location**
```dart
static Future<bool> deleteLocation(int locationId) async {
  final headers = await _getHeaders();

  final response = await http.delete(
    Uri.parse('$baseUrl/destinations/$locationId'),
    headers: headers,
  );

  final data = json.decode(response.body);
  return response.statusCode == 200 && data['success'];
}
```

---

## ❌ **What You DON'T Have:**

1. **POST `/api/locations`** - Does NOT exist
2. **POST `/api/admin/locations`** - Does NOT exist (admins can't directly create pre-approved)

---

## 🆕 **New Endpoints Added:**

✅ **GET `/api/destinations/my-submissions`** - View your submissions
✅ **PUT `/api/destinations/:locationId`** - Update pending location
✅ **DELETE `/api/destinations/:locationId`** - Delete pending location

---

## 📋 **Complete Endpoint List for Mobile App:**

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/destinations` | GET | No | All approved destinations |
| `/api/destinations/:locationId` | GET | No | Single destination |
| `/api/destinations/popular` | GET | No | Popular destinations |
| `/api/destinations/nearby` | GET | No | Nearby destinations |
| `/api/destinations/category/:category` | GET | No | Destinations by category |
| `/api/destinations/suggest` | POST | Yes | Suggest new destination |
| `/api/destinations/my-submissions` | GET | Yes | My submissions |
| `/api/destinations/:locationId` | PUT | Yes | Update my pending destination |
| `/api/destinations/:locationId` | DELETE | Yes | Delete my pending destination |

---

## 🎯 **Next Steps:**

1. ✅ **Restart your backend server** to load the new endpoints
2. ✅ **Use these endpoints in your Flutter app**
3. ⚠️ **Decision needed:** Do you want admins to directly create pre-approved locations?
   - If YES → I'll add `POST /api/admin/locations`
   - If NO → Current workflow is complete

---

## 🚀 **Test Your Backend:**

```bash
# Restart server
cd "C:\Travelya Backend\Travelya-backend"
node src/server.js

# Test the new endpoints
curl http://localhost:3000/api/destinations
```

---

**All location management endpoints are now ready for your mobile app!** 🎉
