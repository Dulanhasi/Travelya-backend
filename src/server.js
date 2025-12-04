require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS || '*',
    credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check endpoint (before everything else)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Travelya API is running',
        timestamp: new Date().toISOString()
    });
});

// Initialize Firebase and Database FIRST
console.log('🔧 Initializing services...');

// Test database connection
const db = require('./config/database');
db.getConnection()
    .then(connection => {
        console.log('✅ MySQL Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('❌ MySQL Database connection failed:', err.message);
        console.error('⚠️  Make sure XAMPP MySQL is running!');
    });

// Initialize Firebase
try {
    const firebase = require('./config/firebase');
    if (firebase && firebase.admin) {
        console.log('✅ Firebase Admin initialized successfully');
    }
} catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    console.error('⚠️  Authentication features will not work without Firebase');
    console.error('📝 To fix: Download firebase-service-account.json and place in root folder');
}

// Import routes AFTER services are initialized
const authRoutes = require('./routes/authRoutes');
const destinationRoutes = require('./routes/destinationRoutes');
const tripRoutes = require('./routes/tripRoutes');
const animalRoutes = require('./routes/animalRoutes');
const serviceProviderRoutes = require('./routes/serviceProviderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const journalRoutes = require('./routes/journalRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/service-providers', serviceProviderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, "0.0.0.0", () => {
    console.log('='.repeat(50));
    console.log(`🚀 Travelya API Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log('='.repeat(50));
});

module.exports = app;