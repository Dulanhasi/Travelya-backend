# Flutter Integration Examples

## Complete Flutter-Backend Integration Guide

### 1. Project Setup

#### pubspec.yaml
```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Firebase
  firebase_core: ^2.24.2
  firebase_auth: ^4.15.3
  cloud_firestore: ^4.13.6
  
  # HTTP & API
  http: ^1.1.0
  
  # State Management
  provider: ^6.1.1
  
  # Local Storage (Offline)
  sqflite: ^2.3.0
  shared_preferences: ^2.2.2
  path_provider: ^2.1.1
  
  # Maps
  mapbox_maps_flutter: ^latest
  geolocator: ^10.1.0
  
  # ML (Animal Recognition)
  tflite_flutter: ^0.10.4
  image_picker: ^1.0.4
  image: ^4.1.3
  
  # UI
  flutter_svg: ^2.0.9
  cached_network_image: ^3.3.0
  
flutter:
  assets:
    - assets/models/
    - assets/images/
```

---

## 2. API Service Layer

### lib/services/api_service.dart
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';

class ApiService {
  // Change this based on your setup
  static const String BASE_URL = 'http://10.0.2.2:3000/api'; // Android Emulator
  // static const String BASE_URL = 'http://localhost:3000/api'; // iOS Simulator
  // static const String BASE_URL = 'http://192.168.1.X:3000/api'; // Real Device
  
  // Get Firebase ID Token
  static Future<String?> _getIdToken() async {
    try {
      User? user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        return await user.getIdToken();
      }
      return null;
    } catch (e) {
      print('Error getting ID token: $e');
      return null;
    }
  }
  
  // GET Request
  static Future<Map<String, dynamic>> get(String endpoint) async {
    try {
      final token = await _getIdToken();
      
      final response = await http.get(
        Uri.parse('$BASE_URL$endpoint'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('API Error: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }
  
  // POST Request
  static Future<Map<String, dynamic>> post(
    String endpoint, 
    Map<String, dynamic> data
  ) async {
    try {
      final token = await _getIdToken();
      
      final response = await http.post(
        Uri.parse('$BASE_URL$endpoint'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode(data),
      );
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        throw Exception('API Error: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }
  
  // PATCH Request
  static Future<Map<String, dynamic>> patch(
    String endpoint,
    Map<String, dynamic> data
  ) async {
    try {
      final token = await _getIdToken();
      
      final response = await http.patch(
        Uri.parse('$BASE_URL$endpoint'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: jsonEncode(data),
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('API Error: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }
  
  // DELETE Request
  static Future<Map<String, dynamic>> delete(String endpoint) async {
    try {
      final token = await _getIdToken();
      
      final response = await http.delete(
        Uri.parse('$BASE_URL$endpoint'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('API Error: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network Error: $e');
    }
  }
}
```

---

## 3. Authentication Service

### lib/services/auth_service.dart
```dart
import 'package:firebase_auth/firebase_auth.dart';
import 'api_service.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  
  // Sign Up
  Future<Map<String, dynamic>> signUp({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String userType, // 'traveler' or 'service_provider'
    String? contactNo,
  }) async {
    try {
      // 1. Create user in Firebase
      UserCredential credential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      // 2. Register in backend
      final response = await ApiService.post('/auth/register', {
        'firebaseUid': credential.user!.uid,
        'email': email,
        'userType': userType,
        'firstName': firstName,
        'lastName': lastName,
        'contactNo': contactNo,
      });
      
      return response;
    } on FirebaseAuthException catch (e) {
      throw Exception(e.message ?? 'Authentication failed');
    } catch (e) {
      throw Exception('Sign up failed: $e');
    }
  }
  
  // Sign In
  Future<Map<String, dynamic>> signIn({
    required String email,
    required String password,
  }) async {
    try {
      // 1. Sign in with Firebase
      UserCredential credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      // 2. Check if user exists in backend
      final response = await ApiService.get(
        '/auth/check/${credential.user!.uid}'
      );
      
      if (response['exists'] == false) {
        throw Exception('User not found in system. Please register first.');
      }
      
      return response;
    } on FirebaseAuthException catch (e) {
      throw Exception(e.message ?? 'Sign in failed');
    } catch (e) {
      throw Exception('Sign in failed: $e');
    }
  }
  
  // Get User Profile
  Future<Map<String, dynamic>> getUserProfile() async {
    try {
      final response = await ApiService.get('/auth/profile');
      return response;
    } catch (e) {
      throw Exception('Failed to get profile: $e');
    }
  }
  
  // Update Profile
  Future<void> updateProfile({
    String? firstName,
    String? lastName,
    String? contactNo,
    String? profileImage,
  }) async {
    try {
      await ApiService.patch('/auth/profile', {
        if (firstName != null) 'firstName': firstName,
        if (lastName != null) 'lastName': lastName,
        if (contactNo != null) 'contactNo': contactNo,
        if (profileImage != null) 'profileImage': profileImage,
      });
    } catch (e) {
      throw Exception('Failed to update profile: $e');
    }
  }
  
  // Sign Out
  Future<void> signOut() async {
    await _auth.signOut();
  }
}
```

---

## 4. Trip Planning Service (n8n Integration)

### lib/services/trip_service.dart
```dart
import 'api_service.dart';

class TripService {
  // Generate AI-powered itinerary
  Future<Map<String, dynamic>> generateItinerary({
    required String destination,
    required DateTime startDate,
    required DateTime endDate,
    required double budget,
    required int numberOfTravelers,
    required List<String> preferences,
    List<String>? activities,
  }) async {
    try {
      final response = await ApiService.post('/trips/generate', {
        'destination': destination,
        'startDate': startDate.toIso8601String().split('T')[0],
        'endDate': endDate.toIso8601String().split('T')[0],
        'budget': budget,
        'numberOfTravelers': numberOfTravelers,
        'preferences': preferences,
        'activities': activities ?? [],
      });
      
      return response;
    } catch (e) {
      throw Exception('Failed to generate itinerary: $e');
    }
  }
  
  // Save trip
  Future<int> saveTrip({
    required String tripName,
    required DateTime startDate,
    required DateTime endDate,
    required double budget,
    required int numberOfTravelers,
    required List<String> preferences,
    required Map<String, dynamic> itinerary,
  }) async {
    try {
      final response = await ApiService.post('/trips/save', {
        'tripName': tripName,
        'startDate': startDate.toIso8601String().split('T')[0],
        'endDate': endDate.toIso8601String().split('T')[0],
        'budget': budget,
        'numberOfTravelers': numberOfTravelers,
        'preferences': preferences,
        'itinerary': itinerary,
      });
      
      return response['data']['tripId'];
    } catch (e) {
      throw Exception('Failed to save trip: $e');
    }
  }
  
  // Get user's trips
  Future<List<dynamic>> getUserTrips() async {
    try {
      final response = await ApiService.get('/trips');
      return response['data'];
    } catch (e) {
      throw Exception('Failed to get trips: $e');
    }
  }
  
  // Get trip details
  Future<Map<String, dynamic>> getTripById(int tripId) async {
    try {
      final response = await ApiService.get('/trips/$tripId');
      return response['data'];
    } catch (e) {
      throw Exception('Failed to get trip details: $e');
    }
  }
}
```

---

## 5. Animal Recognition Service

### lib/services/animal_recognition_service.dart
```dart
import 'dart:io';
import 'package:tflite_flutter/tflite_flutter.dart';
import 'package:image/image.dart' as img;
import 'api_service.dart';

class AnimalRecognitionService {
  Interpreter? _interpreter;
  List<String>? _labels;
  
  // Load TFLite model
  Future<void> loadModel() async {
    try {
      _interpreter = await Interpreter.fromAsset(
        'assets/models/animal_classifier.tflite'
      );
      
      // Load labels (create labels.txt with animal names)
      // _labels = await loadLabels();
      
      print('Model loaded successfully');
    } catch (e) {
      print('Error loading model: $e');
    }
  }
  
  // Recognize animal from image
  Future<Map<String, dynamic>> recognizeAnimal(File imageFile) async {
    try {
      // 1. Preprocess image
      final image = img.decodeImage(imageFile.readAsBytesSync());
      final resizedImage = img.copyResize(image!, width: 224, height: 224);
      
      // 2. Convert to input tensor format
      var input = imageToByteListFloat32(resizedImage, 224, 224);
      
      // 3. Run inference
      var output = List.filled(1 * 10, 0.0).reshape([1, 10]); // Adjust based on your model
      _interpreter!.run(input, output);
      
      // 4. Get top prediction
      final predictions = output[0] as List<double>;
      final maxIndex = predictions.indexOf(predictions.reduce((a, b) => a > b ? a : b));
      final confidence = predictions[maxIndex];
      
      // 5. Get animal name (you need labels list)
      String animalName = 'Animal_$maxIndex'; // Replace with actual label
      
      return {
        'animal': animalName,
        'confidence': confidence,
      };
    } catch (e) {
      throw Exception('Recognition failed: $e');
    }
  }
  
  // Log recognition to backend
  Future<void> logRecognition({
    required String animalName,
    required double confidence,
    String? imageUrl,
    double? lat,
    double? lng,
  }) async {
    try {
      await ApiService.post('/animals/recognize', {
        'animalName': animalName,
        'confidence': confidence,
        'imageUrl': imageUrl ?? '',
        'locationLat': lat,
        'locationLng': lng,
      });
    } catch (e) {
      print('Failed to log recognition: $e');
    }
  }
  
  // Get recognition history
  Future<List<dynamic>> getHistory() async {
    try {
      final response = await ApiService.get('/animals/history');
      return response['data'];
    } catch (e) {
      throw Exception('Failed to get history: $e');
    }
  }
  
  // Get animal information
  Future<Map<String, dynamic>> getAnimalInfo(String animalName) async {
    try {
      final response = await ApiService.get('/animals/info/$animalName');
      return response['data'];
    } catch (e) {
      throw Exception('Failed to get animal info: $e');
    }
  }
  
  // Helper: Convert image to input format
  List<List<List<List<double>>>> imageToByteListFloat32(
    img.Image image,
    int inputWidth,
    int inputHeight,
  ) {
    var convertedBytes = List.generate(
      1,
      (index) => List.generate(
        inputHeight,
        (y) => List.generate(
          inputWidth,
          (x) {
            var pixel = image.getPixel(x, y);
            return [
              pixel.r / 255.0,
              pixel.g / 255.0,
              pixel.b / 255.0,
            ];
          },
        ),
      ),
    );
    return convertedBytes;
  }
}
```

---

## 6. Example UI Screens

### Sign Up Screen
```dart
// lib/screens/signup_screen.dart
import 'package:flutter/material.dart';
import '../services/auth_service.dart';

class SignUpScreen extends StatefulWidget {
  @override
  _SignUpScreenState createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _formKey = GlobalKey<FormState>();
  final _authService = AuthService();
  
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  
  bool _isLoading = false;
  String _userType = 'traveler';
  
  Future<void> _signUp() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    
    try {
      await _authService.signUp(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        userType: _userType,
      );
      
      // Navigate to home
      Navigator.pushReplacementNamed(context, '/home');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Sign up failed: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Sign Up')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _firstNameController,
                decoration: InputDecoration(labelText: 'First Name'),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              TextFormField(
                controller: _lastNameController,
                decoration: InputDecoration(labelText: 'Last Name'),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              TextFormField(
                controller: _emailController,
                decoration: InputDecoration(labelText: 'Email'),
                keyboardType: TextInputType.emailAddress,
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              TextFormField(
                controller: _passwordController,
                decoration: InputDecoration(labelText: 'Password'),
                obscureText: true,
                validator: (v) => v!.length < 6 ? 'Min 6 characters' : null,
              ),
              SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _userType,
                items: [
                  DropdownMenuItem(value: 'traveler', child: Text('Traveler')),
                  DropdownMenuItem(value: 'service_provider', child: Text('Service Provider')),
                ],
                onChanged: (v) => setState(() => _userType = v!),
                decoration: InputDecoration(labelText: 'User Type'),
              ),
              SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _signUp,
                child: _isLoading
                    ? CircularProgressIndicator()
                    : Text('Sign Up'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

### Trip Planning Screen
```dart
// lib/screens/trip_planning_screen.dart
import 'package:flutter/material.dart';
import '../services/trip_service.dart';

class TripPlanningScreen extends StatefulWidget {
  @override
  _TripPlanningScreenState createState() => _TripPlanningScreenState();
}

class _TripPlanningScreenState extends State<TripPlanningScreen> {
  final _tripService = TripService();
  final _destinationController = TextEditingController();
  final _budgetController = TextEditingController();
  
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now().add(Duration(days: 7));
  int _numberOfTravelers = 1;
  List<String> _selectedPreferences = [];
  
  bool _isGenerating = false;
  Map<String, dynamic>? _generatedItinerary;
  
  final List<String> _allPreferences = [
    'cultural',
    'nature',
    'adventure',
    'beach',
    'wildlife',
    'religious',
  ];
  
  Future<void> _generateItinerary() async {
    setState(() => _isGenerating = true);
    
    try {
      final result = await _tripService.generateItinerary(
        destination: _destinationController.text,
        startDate: _startDate,
        endDate: _endDate,
        budget: double.parse(_budgetController.text),
        numberOfTravelers: _numberOfTravelers,
        preferences: _selectedPreferences,
      );
      
      setState(() {
        _generatedItinerary = result['data'];
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Itinerary generated successfully!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed: $e')),
      );
    } finally {
      setState(() => _isGenerating = false);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Plan Your Trip')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _destinationController,
              decoration: InputDecoration(
                labelText: 'Destination',
                hintText: 'e.g., Colombo, Kandy, Nuwara Eliya',
              ),
            ),
            SizedBox(height: 16),
            TextField(
              controller: _budgetController,
              decoration: InputDecoration(labelText: 'Budget (LKR)'),
              keyboardType: TextInputType.number,
            ),
            SizedBox(height: 16),
            Text('Preferences:', style: TextStyle(fontWeight: FontWeight.bold)),
            Wrap(
              spacing: 8,
              children: _allPreferences.map((pref) {
                return FilterChip(
                  label: Text(pref),
                  selected: _selectedPreferences.contains(pref),
                  onSelected: (selected) {
                    setState(() {
                      if (selected) {
                        _selectedPreferences.add(pref);
                      } else {
                        _selectedPreferences.remove(pref);
                      }
                    });
                  },
                );
              }).toList(),
            ),
            SizedBox(height: 24),
            Center(
              child: ElevatedButton.icon(
                onPressed: _isGenerating ? null : _generateItinerary,
                icon: Icon(Icons.auto_awesome),
                label: _isGenerating
                    ? Text('Generating...')
                    : Text('Generate AI Itinerary'),
              ),
            ),
            if (_generatedItinerary != null) ...[
              SizedBox(height: 24),
              Text('Your Itinerary:',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              // Display itinerary here
              Text(_generatedItinerary.toString()),
            ],
          ],
        ),
      ),
    );
  }
}
```

---

## 7. Initialize Services in main.dart

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'services/animal_recognition_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Load ML model
  final animalService = AnimalRecognitionService();
  await animalService.loadModel();
  
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Travelya',
      theme: ThemeData(primarySwatch: Colors.blue),
      initialRoute: '/splash',
      routes: {
        '/splash': (context) => SplashScreen(),
        '/login': (context) => LoginScreen(),
        '/signup': (context) => SignUpScreen(),
        '/home': (context) => HomeScreen(),
        '/trip-planning': (context) => TripPlanningScreen(),
      },
    );
  }
}
```

---

**That's it! You now have complete backend + Flutter integration examples.** 🎉

**Next steps:**
1. Copy these service files to your Flutter project
2. Update API URLs in ApiService
3. Test authentication flow
4. Test trip planning with n8n
5. Integrate your existing animal detector

Let me know which part you want to implement first!
