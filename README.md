# Travelya Backend API

Backend server for the Travelya - Sri Lanka Travel Companion Application.

#My app

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MySQL (v8 or higher)
- Firebase project with Admin SDK
- n8n running locally (for trip planning feature)

### Installation Steps

#### 1. Clone and Install

```bash
cd travelya_backend
npm install
```

#### 2. Setup MySQL Database

```bash
# Login to MySQL
mysql -u root -p

# Run the database schema
mysql -u root -p < database_schema.sql
```

#### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
PORT=3000
NODE_ENV=development

# MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=travelya_db

# Firebase - Download service account JSON from Firebase Console
FIREBASE_PRIVATE_KEY_PATH=./firebase-service-account.json

# n8n - Your local n8n webhook URL
N8N_WEBHOOK_URL=http://localhost:5678/webhook/trip-planner

# JWT
JWT_SECRET=change_this_to_a_random_secret_string
```

#### 4. Setup Firebase Admin SDK

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Rename it to `firebase-service-account.json`
5. Place it in the root directory of your backend project

#### 5. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:3000`

Check health: `http://localhost:3000/health`

---

## 📁 Project Structure

```
travelya_backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MySQL connection
│   │   └── firebase.js          # Firebase Admin setup
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── tripController.js    # Trip planning with n8n
│   │   ├── animalController.js  # Animal recognition logs
│   │   └── ...
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── tripRoutes.js
│   │   ├── animalRoutes.js
│   │   └── ...
│   ├── middleware/
│   │   ├── authMiddleware.js    # Firebase token verification
│   │   └── errorHandler.js      # Error handling
│   ├── utils/
│   │   └── n8nIntegration.js    # n8n webhook integration
│   └── server.js                # Main entry point
├── database_schema.sql          # Database schema
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── package.json
└── README.md
```

---

## 🔌 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| GET | `/check/:firebaseUid` | Check if user exists | No |
| GET | `/profile` | Get user profile | Yes |
| PATCH | `/profile` | Update profile | Yes |
| PATCH | `/traveler-info` | Update traveler info | Yes |
| DELETE | `/account` | Delete account | Yes |

### Trip Planning (`/api/trips`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/generate` | Generate AI itinerary (n8n) | Yes |
| POST | `/save` | Save trip plan | Yes |
| GET | `/` | Get user's trips | Yes |
| GET | `/:tripId` | Get trip details | Yes |
| PATCH | `/:tripId/status` | Update trip status | Yes |
| DELETE | `/:tripId` | Delete trip | Yes |

### Animal Recognition (`/api/animals`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/recognize` | Log animal recognition | Yes |
| GET | `/history` | Get recognition history | Yes |
| GET | `/stats` | Get statistics | Yes |
| GET | `/info/:animalName` | Get animal information | Yes |
| DELETE | `/:recognitionId` | Delete recognition | Yes |

---

## 🔐 Authentication Flow

### 1. Firebase Authentication (Flutter Side)

```dart
// In your Flutter app
UserCredential credential = await FirebaseAuth.instance
    .signInWithEmailAndPassword(email: email, password: password);

String idToken = await credential.user!.getIdToken();
String firebaseUid = credential.user!.uid;
```

### 2. Register User in Backend

```dart
// Call your backend
final response = await http.post(
  Uri.parse('http://your-api/api/auth/register'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'firebaseUid': firebaseUid,
    'email': email,
    'userType': 'traveler',
    'firstName': 'John',
    'lastName': 'Doe'
  }),
);
```

### 3. Make Authenticated Requests

```dart
// Include Firebase ID token in headers
final response = await http.get(
  Uri.parse('http://your-api/api/trips'),
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $idToken'
  },
);
```

---

## 🤖 n8n Integration

### Setup n8n Workflow

1. Install n8n locally:
```bash
npm install n8n -g
n8n start
```

2. Access n8n: `http://localhost:5678`

3. Create a new workflow with:
   - **Webhook Trigger** (POST method)
   - **AI/Logic Nodes** (for trip planning)
   - **Response Node** (return itinerary as JSON)

4. Get your webhook URL (e.g., `http://localhost:5678/webhook/trip-planner`)

5. Add it to your `.env` file:
```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/trip-planner
```

### Expected Input Format

```json
{
  "destination": "Colombo, Kandy, Nuwara Eliya",
  "startDate": "2025-12-01",
  "endDate": "2025-12-07",
  "budget": 50000,
  "numberOfTravelers": 2,
  "preferences": ["cultural", "nature", "adventure"],
  "activities": ["temple visits", "tea plantations", "hiking"]
}
```

### Expected Output Format

```json
{
  "itinerary": [
    {
      "day": 1,
      "date": "2025-12-01",
      "location": "Colombo",
      "activities": [
        {
          "time": "09:00",
          "activity": "Visit Gangaramaya Temple",
          "description": "...",
          "estimatedCost": 500
        }
      ]
    }
  ],
  "totalEstimatedCost": 45000
}
```

---

## 🧪 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firebaseUid": "test-uid-123",
    "email": "test@example.com",
    "userType": "traveler",
    "firstName": "Test",
    "lastName": "User"
  }'

# Generate trip (with Firebase token)
curl -X POST http://localhost:3000/api/trips/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{
    "destination": "Kandy",
    "startDate": "2025-12-01",
    "endDate": "2025-12-05",
    "budget": 30000,
    "numberOfTravelers": 2,
    "preferences": ["cultural", "nature"]
  }'
```

### Using Postman

1. Import the collection (create one from the endpoints above)
2. Set environment variable for `baseUrl`: `http://localhost:3000`
3. For protected routes, add Firebase ID token in Authorization header:
   - Type: Bearer Token
   - Token: Your Firebase ID token

---

## 🔧 Troubleshooting

### MySQL Connection Failed

```bash
# Check MySQL is running
sudo systemctl status mysql

# Check credentials in .env
# Make sure database exists
mysql -u root -p -e "SHOW DATABASES;"
```

### Firebase Admin Initialization Failed

- Make sure `firebase-service-account.json` exists
- Check the file path in `.env`
- Verify JSON file is valid

### n8n Connection Refused

```bash
# Make sure n8n is running
n8n start

# Check webhook URL in .env
# Test webhook manually:
curl -X POST http://localhost:5678/webhook/trip-planner \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Port Already in Use

```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change PORT in .env
PORT=3001
```

---

## 📦 Deployment

### Option 1: Traditional Server (EC2, DigitalOcean, etc.)

1. Install Node.js and MySQL on server
2. Clone repository
3. Set environment variables
4. Install PM2 for process management:
```bash
npm install -g pm2
pm2 start src/server.js --name travelya-api
pm2 save
pm2 startup
```

### Option 2: Docker (Future Enhancement)

Create `Dockerfile` and `docker-compose.yml` for containerized deployment.

---

## 🔒 Security Notes

1. **Never commit `.env` or `firebase-service-account.json`**
2. Change `JWT_SECRET` to a strong random string
3. Enable HTTPS in production
4. Implement rate limiting for APIs
5. Validate all user inputs
6. Keep dependencies updated: `npm audit fix`

---

## 📝 Next Steps

1. **Implement Remaining Controllers**:
   - `destinationController.js`
   - `serviceProviderController.js`
   - `reviewController.js`

2. **Add File Upload Support**:
   - Use Multer for handling image uploads
   - Store in AWS S3 or Firebase Storage

3. **Enhance n8n Workflow**:
   - Add weather API integration
   - Include real-time pricing
   - Add event recommendations

4. **Testing**:
   - Write unit tests (Jest)
   - Integration tests
   - Load testing

5. **Documentation**:
   - Generate API docs with Swagger/OpenAPI
   - Add JSDoc comments

---

## 🆘 Support

For issues or questions:
- Check the troubleshooting section
- Review error logs: Check console output
- Contact: your-email@example.com

---

## 📄 License

This project is part of a Master's thesis at University of Colombo School of Computing.

---

**Last Updated**: November 2025
**Version**: 1.0.0
