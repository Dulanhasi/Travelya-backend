# 🚀 QUICK START GUIDE - Start Here!

## Step-by-Step Setup (Do This Now!)

### ✅ Step 1: Install MySQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation

# macOS
brew install mysql
brew services start mysql

# Windows - Download from: https://dev.mysql.com/downloads/mysql/
```

### ✅ Step 2: Create Database

```bash
# Login to MySQL
mysql -u root -p

# Inside MySQL console:
CREATE DATABASE travelya_db;
exit;

# Import schema
mysql -u root -p travelya_db < database_schema.sql
```

### ✅ Step 3: Setup Node.js Project

```bash
# Create project folder
mkdir travelya_backend
cd travelya_backend

# Copy all the files I provided into this folder
# Make sure folder structure matches:
# travelya_backend/
#   ├── src/
#   │   ├── config/
#   │   ├── controllers/
#   │   ├── routes/
#   │   ├── middleware/
#   │   ├── utils/
#   │   └── server.js
#   ├── .env
#   ├── package.json
#   └── database_schema.sql

# Install dependencies
npm install
```

### ✅ Step 4: Get Firebase Service Account Key

1. Go to: https://console.firebase.google.com/
2. Select your project
3. Click gear icon (⚙️) → Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate New Private Key"
6. Download the JSON file
7. Rename to `firebase-service-account.json`
8. Place in root of `travelya_backend/` folder

### ✅ Step 5: Configure .env File

Create `.env` file in root directory:

```env
PORT=3000
NODE_ENV=development

# MySQL - Change 'your_password' to your MySQL root password
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=travelya_db
DB_PORT=3306

# Firebase - This should match your JSON file location
FIREBASE_PRIVATE_KEY_PATH=./firebase-service-account.json

# n8n - Update after you start n8n
N8N_WEBHOOK_URL=http://localhost:5678/webhook/trip-planner

# JWT - Change to a random string
JWT_SECRET=my-super-secret-jwt-key-change-this

# CORS - Allow all origins for development
ALLOWED_ORIGINS=http://localhost:*,http://127.0.0.1:*
```

### ✅ Step 6: Start n8n (For Trip Planning)

```bash
# Install n8n globally
npm install n8n -g

# Start n8n
n8n start

# n8n will open in browser at: http://localhost:5678
```

**Create a simple n8n workflow:**
1. Add "Webhook" node (Trigger)
   - Method: POST
   - Path: trip-planner
2. Add "Function" node (process data - for now just return it)
   - JavaScript code:
   ```javascript
   return [{
     json: {
       itinerary: [
         {
           day: 1,
           location: items[0].json.destination,
           activities: ["Sample Activity"]
         }
       ]
     }
   }];
   ```
3. Save and activate the workflow
4. Copy the webhook URL and update `.env`

### ✅ Step 7: Start Backend Server

```bash
# In travelya_backend folder
npm run dev

# You should see:
# ✅ MySQL Database connected successfully
# ✅ Firebase Admin initialized successfully
# 🚀 Travelya API Server running on port 3000
```

### ✅ Step 8: Test Backend

Open a new terminal:

```bash
# Test health endpoint
curl http://localhost:3000/health

# Should return:
# {"status":"OK","message":"Travelya API is running","timestamp":"..."}
```

---

## 🔗 Connecting Flutter to Backend

### 1. Update Your Flutter API URLs

In your Flutter app, create a constants file:

```dart
// lib/utils/constants.dart
class ApiConstants {
  // For Android Emulator
  static const String BASE_URL = 'http://10.0.2.2:3000/api';
  
  // For iOS Simulator
  // static const String BASE_URL = 'http://localhost:3000/api';
  
  // For Real Device (replace with your computer's IP)
  // static const String BASE_URL = 'http://192.168.1.X:3000/api';
}
```

### 2. Create API Service Class

```dart
// lib/services/api_service.dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:firebase_auth/firebase_auth.dart';

class ApiService {
  static const String baseUrl = ApiConstants.BASE_URL;
  
  // Get Firebase ID Token
  static Future<String?> _getIdToken() async {
    User? user = FirebaseAuth.instance.currentUser;
    return await user?.getIdToken();
  }
  
  // GET request
  static Future<Map<String, dynamic>> get(String endpoint) async {
    final token = await _getIdToken();
    final response = await http.get(
      Uri.parse('$baseUrl$endpoint'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );
    return jsonDecode(response.body);
  }
  
  // POST request
  static Future<Map<String, dynamic>> post(String endpoint, Map<String, dynamic> data) async {
    final token = await _getIdToken();
    final response = await http.post(
      Uri.parse('$baseUrl$endpoint'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode(data),
    );
    return jsonDecode(response.body);
  }
}
```

### 3. Example: Register User After Firebase Auth

```dart
// After Firebase authentication
UserCredential credential = await FirebaseAuth.instance
    .signInWithEmailAndPassword(email: email, password: password);

// Register in your backend
final response = await ApiService.post('/auth/register', {
  'firebaseUid': credential.user!.uid,
  'email': credential.user!.email,
  'userType': 'traveler',
  'firstName': firstNameController.text,
  'lastName': lastNameController.text,
});

if (response['success']) {
  print('User registered in backend!');
}
```

### 4. Example: Generate Trip with n8n

```dart
// Call trip planning API
final tripData = {
  'destination': 'Kandy, Nuwara Eliya',
  'startDate': '2025-12-01',
  'endDate': '2025-12-05',
  'budget': 50000,
  'numberOfTravelers': 2,
  'preferences': ['cultural', 'nature'],
  'activities': ['temple visits', 'tea plantations']
};

final response = await ApiService.post('/trips/generate', tripData);

if (response['success']) {
  final itinerary = response['data']['itinerary'];
  // Display itinerary in your UI
}
```

### 5. Example: Log Animal Recognition

```dart
// After TFLite detection
final recognitionData = {
  'animalName': detectedAnimal,
  'confidence': confidence,
  'imageUrl': uploadedImageUrl,
  'locationLat': currentLat,
  'locationLng': currentLng,
};

final response = await ApiService.post('/animals/recognize', recognitionData);
```

---

## 📱 Integrating Your Animal Detector

Since you already have the TFLite demo working:

### 1. Copy Model to Flutter App

```
your_flutter_app/
  └── assets/
      └── models/
          └── animal_classifier.tflite
```

### 2. Update pubspec.yaml

```yaml
dependencies:
  tflite_flutter: ^0.10.4
  image_picker: ^1.0.4
  
flutter:
  assets:
    - assets/models/animal_classifier.tflite
```

### 3. Create Recognition Service

```dart
// lib/services/animal_recognition_service.dart
import 'package:tflite_flutter/tflite_flutter.dart';

class AnimalRecognitionService {
  Interpreter? _interpreter;
  
  Future<void> loadModel() async {
    _interpreter = await Interpreter.fromAsset('assets/models/animal_classifier.tflite');
  }
  
  Future<Map<String, dynamic>> recognizeAnimal(imageFile) async {
    // Your existing recognition code
    // Returns: { 'animal': 'elephant', 'confidence': 0.95 }
  }
}
```

### 4. Connect to Backend

```dart
// After recognition
final result = await recognitionService.recognizeAnimal(imageFile);

// Log to backend
await ApiService.post('/animals/recognize', {
  'animalName': result['animal'],
  'confidence': result['confidence'],
  'imageUrl': await uploadImage(imageFile), // Upload to Firebase Storage
  'locationLat': latitude,
  'locationLng': longitude,
});

// Get animal info from backend
final info = await ApiService.get('/animals/info/${result['animal']}');
```

---

## 🐛 Common Issues & Solutions

### Issue: "MySQL connection failed"
**Solution**: Check MySQL is running and password in `.env` is correct

### Issue: "Firebase initialization failed"
**Solution**: Make sure `firebase-service-account.json` exists and path in `.env` is correct

### Issue: "Cannot connect to n8n"
**Solution**: Make sure n8n is running (`n8n start`) and webhook URL in `.env` is correct

### Issue: "Port 3000 already in use"
**Solution**: Kill the process or change PORT in `.env` to 3001

### Issue: Flutter can't connect to backend
**Solution**: 
- Android Emulator: Use `http://10.0.2.2:3000/api`
- Real device: Use your computer's IP address
- Make sure backend is running!

---

## ✅ Verification Checklist

Before moving to Flutter integration:

- [ ] MySQL installed and running
- [ ] Database `travelya_db` created
- [ ] Tables created (run schema.sql)
- [ ] Node.js project set up with all files
- [ ] `npm install` completed successfully
- [ ] `.env` file configured
- [ ] Firebase service account JSON downloaded and placed
- [ ] n8n installed and workflow created
- [ ] Backend server starts without errors
- [ ] Health check endpoint returns OK
- [ ] Can register a test user via curl/Postman

---

## 📞 Next Steps

Once backend is running:

1. **Test all endpoints** using Postman or curl
2. **Connect your Flutter UI** to authentication endpoints
3. **Integrate trip planning** with your existing UI
4. **Add animal detector** to main app and connect to backend
5. **Test offline functionality** in Flutter
6. **Implement remaining features** (reviews, service providers, etc.)

---

## 🎯 Priority Integration Order

1. ✅ Authentication (Login/Register) - **Do This First**
2. ✅ Trip Planning (n8n integration) - **Your unique feature**
3. ✅ Animal Recognition (TFLite + backend logging) - **Another unique feature**
4. Maps & Navigation (Mapbox)
5. Service Providers (Hotels, Guides, Taxis)
6. Reviews & Ratings
7. Emergency/SOS
8. Travel Journals
9. Payments (can be simulated initially)

---

**Good luck! You're on the right track. Start with Step 1 and work your way through. Let me know if you get stuck!** 🚀
