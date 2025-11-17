-- Travelya Database Schema
-- Drop existing database if needed (BE CAREFUL!)
-- DROP DATABASE IF EXISTS travelya_db;

-- Create database
CREATE DATABASE IF NOT EXISTS travelya_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE travelya_db;

-- ==========================================
-- Users Table
-- ==========================================
CREATE TABLE users (
    userId INT AUTO_INCREMENT PRIMARY KEY,
    firebaseUid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    userType ENUM('traveler', 'service_provider', 'admin') NOT NULL,
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    contactNo VARCHAR(20),
    profileImage VARCHAR(512),
    gender ENUM('male', 'female', 'other'),
    isActive BOOLEAN DEFAULT TRUE,
    isVerified BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_firebase_uid (firebaseUid),
    INDEX idx_email (email),
    INDEX idx_user_type (userType)
) ENGINE=InnoDB;

-- ==========================================
-- Travelers Table (extends users)
-- ==========================================
CREATE TABLE travelers (
    travelerId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    passportNo VARCHAR(50),
    nicNo VARCHAR(20),
    nationality VARCHAR(100),
    dateOfBirth DATE,
    emergencyContact VARCHAR(20),
    emergencyContactName VARCHAR(100),
    
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
    UNIQUE KEY unique_user (userId)
) ENGINE=InnoDB;

-- ==========================================
-- Service Providers Table (extends users)
-- ==========================================
CREATE TABLE service_providers (
    providerId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    businessName VARCHAR(255) NOT NULL,
    providerType ENUM('hotel', 'guide', 'taxi', 'restaurant', 'other') NOT NULL,
    businessRegistrationNo VARCHAR(100),
    description TEXT,
    address VARCHAR(512),
    locationLat DECIMAL(10, 8),
    locationLng DECIMAL(11, 8),
    overallRating DECIMAL(3, 2) DEFAULT 0.00,
    totalReviews INT DEFAULT 0,
    isApproved BOOLEAN DEFAULT FALSE,
    approvedAt TIMESTAMP NULL,
    approvedBy INT,
    
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
    FOREIGN KEY (approvedBy) REFERENCES users(userId),
    UNIQUE KEY unique_user (userId),
    INDEX idx_provider_type (providerType),
    INDEX idx_approved (isApproved)
) ENGINE=InnoDB;

-- ==========================================
-- Service Packages Table
-- ==========================================
CREATE TABLE service_packages (
    packageId INT AUTO_INCREMENT PRIMARY KEY,
    providerId INT NOT NULL,
    packageName VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'LKR',
    duration VARCHAR(100),
    maxPeople INT,
    images JSON,
    amenities JSON,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (providerId) REFERENCES service_providers(providerId) ON DELETE CASCADE,
    INDEX idx_provider (providerId),
    INDEX idx_active (isActive)
) ENGINE=InnoDB;

-- ==========================================
-- Locations/Destinations Table
-- ==========================================
CREATE TABLE locations (
    locationId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category ENUM('cultural', 'nature', 'adventure', 'beach', 'historical', 'wildlife', 'religious', 'other') NOT NULL,
    description TEXT,
    coordinates JSON, -- {lat, lng}
    address VARCHAR(512),
    district VARCHAR(100),
    province VARCHAR(100),
    images JSON, -- Array of image URLs
    ratings DECIMAL(3, 2) DEFAULT 0.00,
    totalReviews INT DEFAULT 0,
    entryFee DECIMAL(10, 2),
    openingHours JSON, -- {monday: "8:00-17:00", ...}
    isApproved BOOLEAN DEFAULT FALSE,
    approvedAt TIMESTAMP NULL,
    approvedBy INT,
    suggestedBy INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (approvedBy) REFERENCES users(userId),
    FOREIGN KEY (suggestedBy) REFERENCES users(userId),
    INDEX idx_category (category),
    INDEX idx_district (district),
    INDEX idx_approved (isApproved),
    FULLTEXT idx_search (name, description)
) ENGINE=InnoDB;

-- ==========================================
-- Trip Plans Table
-- ==========================================
CREATE TABLE trip_plans (
    tripId INT AUTO_INCREMENT PRIMARY KEY,
    travelerId INT NOT NULL,
    tripName VARCHAR(255) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    budget DECIMAL(10, 2),
    numberOfTravelers INT DEFAULT 1,
    preferences JSON, -- Array of preference strings
    itinerary JSON, -- Generated from n8n
    status ENUM('planning', 'confirmed', 'ongoing', 'completed', 'cancelled') DEFAULT 'planning',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (travelerId) REFERENCES travelers(travelerId) ON DELETE CASCADE,
    INDEX idx_traveler (travelerId),
    INDEX idx_dates (startDate, endDate),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ==========================================
-- Trip Locations (Many-to-Many)
-- ==========================================
CREATE TABLE trip_locations (
    tripLocationId INT AUTO_INCREMENT PRIMARY KEY,
    tripId INT NOT NULL,
    locationId INT NOT NULL,
    visitDate DATE,
    dayNumber INT,
    orderInDay INT,
    notes TEXT,
    
    FOREIGN KEY (tripId) REFERENCES trip_plans(tripId) ON DELETE CASCADE,
    FOREIGN KEY (locationId) REFERENCES locations(locationId) ON DELETE CASCADE,
    UNIQUE KEY unique_trip_location (tripId, locationId, visitDate)
) ENGINE=InnoDB;

-- ==========================================
-- Service Requests/Bookings Table
-- ==========================================
CREATE TABLE service_requests (
    requestId INT AUTO_INCREMENT PRIMARY KEY,
    travelerId INT NOT NULL,
    providerId INT NOT NULL,
    packageId INT,
    tripId INT,
    requestDate DATE NOT NULL,
    numberOfPeople INT DEFAULT 1,
    specialRequirements TEXT,
    status ENUM('pending', 'accepted', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
    totalAmount DECIMAL(10, 2),
    isPaid BOOLEAN DEFAULT FALSE,
    paymentIntentId VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (travelerId) REFERENCES travelers(travelerId) ON DELETE CASCADE,
    FOREIGN KEY (providerId) REFERENCES service_providers(providerId) ON DELETE CASCADE,
    FOREIGN KEY (packageId) REFERENCES service_packages(packageId) ON DELETE SET NULL,
    FOREIGN KEY (tripId) REFERENCES trip_plans(tripId) ON DELETE SET NULL,
    INDEX idx_traveler (travelerId),
    INDEX idx_provider (providerId),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ==========================================
-- Reviews Table
-- ==========================================
CREATE TABLE reviews (
    reviewId INT AUTO_INCREMENT PRIMARY KEY,
    reviewerId INT NOT NULL,
    reviewType ENUM('location', 'service_provider') NOT NULL,
    targetId INT NOT NULL, -- locationId or providerId
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    images JSON,
    isVerified BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (reviewerId) REFERENCES users(userId) ON DELETE CASCADE,
    INDEX idx_target (reviewType, targetId),
    INDEX idx_rating (rating)
) ENGINE=InnoDB;

-- ==========================================
-- Travel Journals Table
-- ==========================================
CREATE TABLE travel_journals (
    journalId INT AUTO_INCREMENT PRIMARY KEY,
    travelerId INT NOT NULL,
    tripId INT,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    visitDate DATE,
    locationId INT,
    images JSON,
    isPublic BOOLEAN DEFAULT FALSE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (travelerId) REFERENCES travelers(travelerId) ON DELETE CASCADE,
    FOREIGN KEY (tripId) REFERENCES trip_plans(tripId) ON DELETE SET NULL,
    FOREIGN KEY (locationId) REFERENCES locations(locationId) ON DELETE SET NULL,
    INDEX idx_traveler (travelerId),
    INDEX idx_public (isPublic)
) ENGINE=InnoDB;

-- ==========================================
-- Animal Recognition Logs Table
-- ==========================================
CREATE TABLE animal_recognitions (
    recognitionId INT AUTO_INCREMENT PRIMARY KEY,
    travelerId INT NOT NULL,
    animalName VARCHAR(255),
    confidence DECIMAL(5, 4),
    imageUrl VARCHAR(512),
    locationLat DECIMAL(10, 8),
    locationLng DECIMAL(11, 8),
    recognizedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (travelerId) REFERENCES travelers(travelerId) ON DELETE CASCADE,
    INDEX idx_traveler (travelerId),
    INDEX idx_animal (animalName)
) ENGINE=InnoDB;

-- ==========================================
-- SOS/Emergency Alerts Table
-- ==========================================
CREATE TABLE emergency_alerts (
    alertId INT AUTO_INCREMENT PRIMARY KEY,
    travelerId INT NOT NULL,
    alertType ENUM('sos', 'medical', 'police', 'other') NOT NULL,
    message TEXT,
    locationLat DECIMAL(10, 8),
    locationLng DECIMAL(11, 8),
    status ENUM('active', 'resolved', 'false_alarm') DEFAULT 'active',
    resolvedAt TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (travelerId) REFERENCES travelers(travelerId) ON DELETE CASCADE,
    INDEX idx_traveler (travelerId),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ==========================================
-- Notifications Table
-- ==========================================
CREATE TABLE notifications (
    notificationId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
    isRead BOOLEAN DEFAULT FALSE,
    relatedEntityType VARCHAR(50),
    relatedEntityId INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE,
    INDEX idx_user (userId),
    INDEX idx_read (isRead)
) ENGINE=InnoDB;

-- ==========================================
-- Complaints Table
-- ==========================================
CREATE TABLE complaints (
    complaintId INT AUTO_INCREMENT PRIMARY KEY,
    complainantId INT NOT NULL,
    complainantType ENUM('traveler', 'service_provider') NOT NULL,
    targetUserId INT,
    complaintType VARCHAR(100),
    description TEXT NOT NULL,
    status ENUM('pending', 'investigating', 'resolved', 'rejected') DEFAULT 'pending',
    resolvedBy INT,
    resolution TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolvedAt TIMESTAMP NULL,
    
    FOREIGN KEY (complainantId) REFERENCES users(userId) ON DELETE CASCADE,
    FOREIGN KEY (targetUserId) REFERENCES users(userId) ON DELETE SET NULL,
    FOREIGN KEY (resolvedBy) REFERENCES users(userId),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- ==========================================
-- Chat Messages Table (for Firebase sync reference)
-- ==========================================
CREATE TABLE chat_messages (
    messageId INT AUTO_INCREMENT PRIMARY KEY,
    senderId INT NOT NULL,
    receiverId INT NOT NULL,
    message TEXT NOT NULL,
    messageType ENUM('text', 'image', 'location') DEFAULT 'text',
    isRead BOOLEAN DEFAULT FALSE,
    firebaseMessageId VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (senderId) REFERENCES users(userId) ON DELETE CASCADE,
    FOREIGN KEY (receiverId) REFERENCES users(userId) ON DELETE CASCADE,
    INDEX idx_conversation (senderId, receiverId),
    INDEX idx_firebase (firebaseMessageId)
) ENGINE=InnoDB;

-- ==========================================
-- Insert Sample Admin User
-- ==========================================
INSERT INTO users (firebaseUid, email, userType, firstName, lastName, isVerified) 
VALUES 
('admin-firebase-uid-placeholder', 'admin@travelya.lk', 'admin', 'Admin', 'User', TRUE);

-- ==========================================
-- Useful Views
-- ==========================================

-- Active Service Providers with Packages
CREATE VIEW active_providers_with_packages AS
SELECT 
    sp.providerId,
    sp.businessName,
    sp.providerType,
    sp.overallRating,
    u.email,
    u.contactNo,
    COUNT(pkg.packageId) as totalPackages
FROM service_providers sp
JOIN users u ON sp.userId = u.userId
LEFT JOIN service_packages pkg ON sp.providerId = pkg.providerId AND pkg.isActive = TRUE
WHERE sp.isApproved = TRUE
GROUP BY sp.providerId;

-- Popular Locations
CREATE VIEW popular_locations AS
SELECT 
    l.locationId,
    l.name,
    l.category,
    l.district,
    l.ratings,
    l.totalReviews
FROM locations l
WHERE l.isApproved = TRUE
ORDER BY l.ratings DESC, l.totalReviews DESC;
