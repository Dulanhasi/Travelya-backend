const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
let firebaseApp = null;
let authInstance = null;
let firestoreInstance = null;

try {
    const serviceAccountPath = process.env.FIREBASE_PRIVATE_KEY_PATH || 
                               path.join(__dirname, '../../firebase-service-account.json');
    
    const serviceAccount = require(serviceAccountPath);
    
    firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
    });
    
    authInstance = admin.auth();
    firestoreInstance = admin.firestore();
    
    // Don't log success here - will be logged in server.js
} catch (error) {
    console.error('⚠️  Firebase initialization skipped:', error.message);
    
    // Create mock auth for development without Firebase
    authInstance = {
        verifyIdToken: async () => {
            throw new Error('Firebase not configured. Please add firebase-service-account.json');
        }
    };
}

// Export admin and auth
module.exports = {
    admin: firebaseApp || admin,
    auth: authInstance,
    firestore: firestoreInstance
};