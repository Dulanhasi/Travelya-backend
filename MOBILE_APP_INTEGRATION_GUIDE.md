# 📱 Mobile App Integration Guide - Profile APIs

## Base URL
```
http://localhost:3000/api
```
**Production:** Replace with your actual server URL

---

## 🔐 Authentication Setup

### Authorization Header Format
All protected endpoints require Firebase authentication token:

```
Authorization: Bearer <firebase-id-token>
```

### How to Get Firebase ID Token (Flutter Example)
```dart
import 'package:firebase_auth/firebase_auth.dart';

Future<String?> getFirebaseToken() async {
  User? user = FirebaseAuth.instance.currentUser;
  if (user != null) {
    return await user.getIdToken();
  }
  return null;
}
```

---

## 📋 Profile API Details

### 1. GET User Profile
**Endpoint:** `GET /api/auth/profile`
**Authentication:** Required
**Headers:**
```json
{
  "Authorization": "Bearer <firebase-id-token>",
  "Content-Type": "application/json"
}
```

#### Success Response (Traveler)
**Status Code:** `200 OK`
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "firebaseUid": "abc123xyz",
    "email": "user@example.com",
    "userType": "traveler",
    "firstName": "John",
    "lastName": "Doe",
    "contactNo": "+94771234567",
    "profileImage": "https://example.com/profile.jpg",
    "gender": "male",
    "isActive": true,
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "travelerInfo": {
      "travelerId": 1,
      "passportNo": "N1234567",
      "nicNo": "123456789V",
      "nationality": "Sri Lankan",
      "dateOfBirth": "1990-01-01",
      "emergencyContact": "+94771234568",
      "emergencyContactName": "Jane Doe"
    }
  }
}
```

#### Success Response (Service Provider)
**Status Code:** `200 OK`
```json
{
  "success": true,
  "data": {
    "userId": 2,
    "firebaseUid": "xyz789abc",
    "email": "provider@example.com",
    "userType": "service_provider",
    "firstName": "Hotel",
    "lastName": "Owner",
    "contactNo": "+94771234569",
    "profileImage": "https://example.com/profile.jpg",
    "gender": "male",
    "isActive": true,
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "providerInfo": {
      "providerId": 1,
      "businessName": "Luxury Hotel",
      "providerType": "hotel",
      "description": "A luxury hotel in Colombo",
      "address": "123 Main St, Colombo",
      "locationLat": 6.9271,
      "locationLng": 79.8612,
      "overallRating": 4.5,
      "totalReviews": 100,
      "isApproved": true
    }
  }
}
```

#### Error Response (Not Found)
**Status Code:** `404 Not Found`
```json
{
  "success": false,
  "message": "User profile not found"
}
```

#### Error Response (Unauthorized)
**Status Code:** `401 Unauthorized`
```json
{
  "success": false,
  "message": "Invalid authentication token"
}
```

---

### 2. UPDATE User Profile (Basic Info)
**Endpoint:** `PATCH /api/auth/profile`
**Authentication:** Required
**Headers:**
```json
{
  "Authorization": "Bearer <firebase-id-token>",
  "Content-Type": "application/json"
}
```

#### Request Body
All fields are **optional** (send only fields you want to update):
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "contactNo": "+94771234567",
  "profileImage": "https://example.com/new-profile.jpg",
  "gender": "male"
}
```

**Field Validations:**
- `firstName`: String (max 100 characters)
- `lastName`: String (max 100 characters)
- `contactNo`: String (max 20 characters)
- `profileImage`: String URL (max 512 characters)
- `gender`: Enum - `"male"`, `"female"`, or `"other"`

#### Success Response
**Status Code:** `200 OK`
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

#### Error Response (Not Found)
**Status Code:** `404 Not Found`
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 3. UPDATE Traveler Info
**Endpoint:** `PATCH /api/auth/traveler-info`
**Authentication:** Required
**User Type:** Only `traveler` users can access
**Headers:**
```json
{
  "Authorization": "Bearer <firebase-id-token>",
  "Content-Type": "application/json"
}
```

#### Request Body
All fields are **optional** (send only fields you want to update):
```json
{
  "passportNo": "N1234567",
  "nicNo": "123456789V",
  "nationality": "Sri Lankan",
  "dateOfBirth": "1990-01-01",
  "emergencyContact": "+94771234568",
  "emergencyContactName": "Jane Doe"
}
```

**Field Validations:**
- `passportNo`: String (max 50 characters)
- `nicNo`: String (max 20 characters)
- `nationality`: String (max 100 characters)
- `dateOfBirth`: Date string in format `YYYY-MM-DD`
- `emergencyContact`: String (max 20 characters)
- `emergencyContactName`: String (max 100 characters)

#### Success Response
**Status Code:** `200 OK`
```json
{
  "success": true,
  "message": "Traveler info updated successfully"
}
```

#### Error Response (Forbidden)
**Status Code:** `403 Forbidden`
```json
{
  "success": false,
  "message": "Only travelers can update traveler info"
}
```

---

## 🔄 Flutter/Dart Implementation Examples

### API Service Class
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:3000/api';

  // Get Firebase token
  static Future<String?> _getToken() async {
    User? user = FirebaseAuth.instance.currentUser;
    if (user != null) {
      return await user.getIdToken();
    }
    return null;
  }

  // Get common headers
  static Future<Map<String, String>> _getHeaders() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // GET User Profile
  static Future<Map<String, dynamic>> getUserProfile() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/auth/profile'),
        headers: headers,
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success']) {
        return data['data'];
      } else {
        throw Exception(data['message'] ?? 'Failed to load profile');
      }
    } catch (e) {
      throw Exception('Error fetching profile: $e');
    }
  }

  // UPDATE Basic Profile
  static Future<bool> updateProfile({
    String? firstName,
    String? lastName,
    String? contactNo,
    String? profileImage,
    String? gender,
  }) async {
    try {
      final headers = await _getHeaders();

      // Build request body with only non-null fields
      final Map<String, dynamic> body = {};
      if (firstName != null) body['firstName'] = firstName;
      if (lastName != null) body['lastName'] = lastName;
      if (contactNo != null) body['contactNo'] = contactNo;
      if (profileImage != null) body['profileImage'] = profileImage;
      if (gender != null) body['gender'] = gender;

      final response = await http.patch(
        Uri.parse('$baseUrl/auth/profile'),
        headers: headers,
        body: json.encode(body),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success']) {
        return true;
      } else {
        throw Exception(data['message'] ?? 'Failed to update profile');
      }
    } catch (e) {
      throw Exception('Error updating profile: $e');
    }
  }

  // UPDATE Traveler Info
  static Future<bool> updateTravelerInfo({
    String? passportNo,
    String? nicNo,
    String? nationality,
    String? dateOfBirth,
    String? emergencyContact,
    String? emergencyContactName,
  }) async {
    try {
      final headers = await _getHeaders();

      // Build request body with only non-null fields
      final Map<String, dynamic> body = {};
      if (passportNo != null) body['passportNo'] = passportNo;
      if (nicNo != null) body['nicNo'] = nicNo;
      if (nationality != null) body['nationality'] = nationality;
      if (dateOfBirth != null) body['dateOfBirth'] = dateOfBirth;
      if (emergencyContact != null) body['emergencyContact'] = emergencyContact;
      if (emergencyContactName != null) body['emergencyContactName'] = emergencyContactName;

      final response = await http.patch(
        Uri.parse('$baseUrl/auth/traveler-info'),
        headers: headers,
        body: json.encode(body),
      );

      final data = json.decode(response.body);

      if (response.statusCode == 200 && data['success']) {
        return true;
      } else {
        throw Exception(data['message'] ?? 'Failed to update traveler info');
      }
    } catch (e) {
      throw Exception('Error updating traveler info: $e');
    }
  }
}
```

---

### User Model Class
```dart
class User {
  final int userId;
  final String firebaseUid;
  final String email;
  final String userType;
  final String? firstName;
  final String? lastName;
  final String? contactNo;
  final String? profileImage;
  final String? gender;
  final bool isActive;
  final bool isVerified;
  final DateTime createdAt;
  final TravelerInfo? travelerInfo;
  final ProviderInfo? providerInfo;

  User({
    required this.userId,
    required this.firebaseUid,
    required this.email,
    required this.userType,
    this.firstName,
    this.lastName,
    this.contactNo,
    this.profileImage,
    this.gender,
    required this.isActive,
    required this.isVerified,
    required this.createdAt,
    this.travelerInfo,
    this.providerInfo,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      userId: json['userId'],
      firebaseUid: json['firebaseUid'],
      email: json['email'],
      userType: json['userType'],
      firstName: json['firstName'],
      lastName: json['lastName'],
      contactNo: json['contactNo'],
      profileImage: json['profileImage'],
      gender: json['gender'],
      isActive: json['isActive'] == 1 || json['isActive'] == true,
      isVerified: json['isVerified'] == 1 || json['isVerified'] == true,
      createdAt: DateTime.parse(json['createdAt']),
      travelerInfo: json['travelerInfo'] != null
          ? TravelerInfo.fromJson(json['travelerInfo'])
          : null,
      providerInfo: json['providerInfo'] != null
          ? ProviderInfo.fromJson(json['providerInfo'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'firebaseUid': firebaseUid,
      'email': email,
      'userType': userType,
      'firstName': firstName,
      'lastName': lastName,
      'contactNo': contactNo,
      'profileImage': profileImage,
      'gender': gender,
      'isActive': isActive,
      'isVerified': isVerified,
      'createdAt': createdAt.toIso8601String(),
      'travelerInfo': travelerInfo?.toJson(),
      'providerInfo': providerInfo?.toJson(),
    };
  }
}

class TravelerInfo {
  final int travelerId;
  final String? passportNo;
  final String? nicNo;
  final String? nationality;
  final String? dateOfBirth;
  final String? emergencyContact;
  final String? emergencyContactName;

  TravelerInfo({
    required this.travelerId,
    this.passportNo,
    this.nicNo,
    this.nationality,
    this.dateOfBirth,
    this.emergencyContact,
    this.emergencyContactName,
  });

  factory TravelerInfo.fromJson(Map<String, dynamic> json) {
    return TravelerInfo(
      travelerId: json['travelerId'],
      passportNo: json['passportNo'],
      nicNo: json['nicNo'],
      nationality: json['nationality'],
      dateOfBirth: json['dateOfBirth'],
      emergencyContact: json['emergencyContact'],
      emergencyContactName: json['emergencyContactName'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'travelerId': travelerId,
      'passportNo': passportNo,
      'nicNo': nicNo,
      'nationality': nationality,
      'dateOfBirth': dateOfBirth,
      'emergencyContact': emergencyContact,
      'emergencyContactName': emergencyContactName,
    };
  }
}

class ProviderInfo {
  final int providerId;
  final String businessName;
  final String providerType;
  final String? description;
  final String? address;
  final double? locationLat;
  final double? locationLng;
  final double? overallRating;
  final int? totalReviews;
  final bool isApproved;

  ProviderInfo({
    required this.providerId,
    required this.businessName,
    required this.providerType,
    this.description,
    this.address,
    this.locationLat,
    this.locationLng,
    this.overallRating,
    this.totalReviews,
    required this.isApproved,
  });

  factory ProviderInfo.fromJson(Map<String, dynamic> json) {
    return ProviderInfo(
      providerId: json['providerId'],
      businessName: json['businessName'],
      providerType: json['providerType'],
      description: json['description'],
      address: json['address'],
      locationLat: json['locationLat']?.toDouble(),
      locationLng: json['locationLng']?.toDouble(),
      overallRating: json['overallRating']?.toDouble(),
      totalReviews: json['totalReviews'],
      isApproved: json['isApproved'] == 1 || json['isApproved'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'providerId': providerId,
      'businessName': businessName,
      'providerType': providerType,
      'description': description,
      'address': address,
      'locationLat': locationLat,
      'locationLng': locationLng,
      'overallRating': overallRating,
      'totalReviews': totalReviews,
      'isApproved': isApproved,
    };
  }
}
```

---

### Usage Example in ProfileScreen
```dart
import 'package:flutter/material.dart';

class ProfileScreen extends StatefulWidget {
  @override
  _ProfileScreenState createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  User? currentUser;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadProfile();
  }

  Future<void> loadProfile() async {
    try {
      setState(() => isLoading = true);

      final profileData = await ApiService.getUserProfile();

      setState(() {
        currentUser = User.fromJson(profileData);
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  Future<void> updateProfile() async {
    try {
      final success = await ApiService.updateProfile(
        firstName: 'Updated First Name',
        lastName: 'Updated Last Name',
      );

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Profile updated successfully')),
        );
        loadProfile(); // Reload profile
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
      return Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (currentUser == null) {
      return Scaffold(
        body: Center(child: Text('Failed to load profile')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text('Profile')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Name: ${currentUser!.firstName} ${currentUser!.lastName}'),
            Text('Email: ${currentUser!.email}'),
            Text('Contact: ${currentUser!.contactNo ?? "Not set"}'),

            if (currentUser!.userType == 'traveler' && currentUser!.travelerInfo != null) ...[
              SizedBox(height: 20),
              Text('Traveler Info:', style: TextStyle(fontWeight: FontWeight.bold)),
              Text('Passport: ${currentUser!.travelerInfo!.passportNo ?? "Not set"}'),
              Text('Nationality: ${currentUser!.travelerInfo!.nationality ?? "Not set"}'),
            ],

            SizedBox(height: 20),
            ElevatedButton(
              onPressed: updateProfile,
              child: Text('Update Profile'),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 🔍 Important Notes

### 1. **Boolean Values**
The backend returns booleans as `true/false` in JSON. Handle them like:
```dart
isActive: json['isActive'] == 1 || json['isActive'] == true
```

### 2. **Date Format**
- Send dates as: `"YYYY-MM-DD"` (e.g., `"1990-01-01"`)
- Receive dates as ISO 8601: `"2024-01-01T00:00:00.000Z"`

### 3. **Optional Fields**
- Only send fields you want to update in PATCH requests
- Use `COALESCE` on backend means null values won't override existing data

### 4. **User Types**
- `"traveler"` - Gets `travelerInfo` object
- `"service_provider"` - Gets `providerInfo` object
- `"admin"` - Gets basic user info only

### 5. **Error Handling**
Always check both `response.statusCode` and `data['success']`:
```dart
if (response.statusCode == 200 && data['success']) {
  // Success
} else {
  // Handle error with data['message']
}
```

---

## 📱 Quick Testing

### Using cURL
```bash
# Get Profile
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"

# Update Profile
curl -X PATCH http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe"
  }'

# Update Traveler Info
curl -X PATCH http://localhost:3000/api/auth/traveler-info \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "passportNo": "N1234567",
    "nationality": "Sri Lankan"
  }'
```

---

## ✅ Checklist for Mobile Implementation

- [ ] Add `http` package to `pubspec.yaml`
- [ ] Add `firebase_auth` package
- [ ] Create `ApiService` class
- [ ] Create `User`, `TravelerInfo`, `ProviderInfo` model classes
- [ ] Implement `getUserProfile()` method
- [ ] Implement `updateProfile()` method
- [ ] Implement `updateTravelerInfo()` method
- [ ] Handle authentication token refresh
- [ ] Add error handling for network failures
- [ ] Add loading states in UI
- [ ] Test with both traveler and service provider accounts

---

**Need Help?** Refer to [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for all other endpoints!
