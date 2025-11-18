const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin SDK
let firebaseApp = null;
let authInstance = null;
let firestoreInstance = null;

try {
    // Build absolute path from project root
    const projectRoot = path.resolve(__dirname, '../..');
    const serviceAccountPath = path.join(projectRoot, 'firebase-service-account.json');
    
    console.log('🔍 Project root:', projectRoot);
    console.log('🔍 Looking for config at:', serviceAccountPath);
    console.log('🔍 File exists?', fs.existsSync(serviceAccountPath));
    
    if (!fs.existsSync(serviceAccountPath)) {
        throw new Error(`File not found at: ${serviceAccountPath}`);
    }
    
    const serviceAccount = require(serviceAccountPath);
    
    console.log('✅ Firebase config loaded successfully');
    console.log('📋 Project ID:', serviceAccount.project_id);
    
    firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    
    authInstance = admin.auth();
    firestoreInstance = admin.firestore();
    
    console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization failed!');
    console.error('❌ Error:', error.message);
    
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
