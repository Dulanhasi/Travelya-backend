const db = require('../config/database');
const { auth } = require('../config/firebase');

/**
 * Register new user
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
    try {
        const { firebaseUid, email, userType, firstName, lastName, contactNo, profileImage } = req.body;

        // Validate required fields
        if (!firebaseUid || !email || !userType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: firebaseUid, email, userType'
            });
        }

        // Validate userType
        const validUserTypes = ['traveler', 'service_provider', 'admin'];
        if (!validUserTypes.includes(userType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid userType. Must be: traveler, service_provider, or admin'
            });
        }

        // Check if user already exists
        const [existingUsers] = await db.query(
            'SELECT userId FROM users WHERE firebaseUid = ? OR email = ?',
            [firebaseUid, email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'User already exists with this Firebase UID or email'
            });
        }

        // Insert user into users table
        const [userResult] = await db.query(
            `INSERT INTO users (firebaseUid, email, userType, firstName, lastName, contactNo, profileImage) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [firebaseUid, email, userType, firstName, lastName, contactNo, profileImage]
        );

        const userId = userResult.insertId;

        // If traveler, create traveler record
        if (userType === 'traveler') {
            await db.query(
                'INSERT INTO travelers (userId) VALUES (?)',
                [userId]
            );
        }

        // If service provider, create service provider record
        if (userType === 'service_provider') {
            await db.query(
                'INSERT INTO service_providers (userId, businessName, providerType) VALUES (?, ?, ?)',
                [userId, req.body.businessName || 'Not Set', req.body.providerType || 'other']
            );
        }

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                userId,
                email,
                userType
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        next(error);
    }
};

/**
 * Get current user profile
 * GET /api/auth/profile
 */
exports.getProfile = async (req, res, next) => {
    try {
        const firebaseUid = req.user.uid;

        const [users] = await db.query(
            `SELECT 
                u.userId,
                u.firebaseUid,
                u.email,
                u.userType,
                u.firstName,
                u.lastName,
                u.contactNo,
                u.profileImage,
                u.gender,
                u.isActive,
                u.isVerified,
                u.createdAt
            FROM users u
            WHERE u.firebaseUid = ?`,
            [firebaseUid]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        const user = users[0];

        // Get additional info based on user type
        if (user.userType === 'traveler') {
            const [travelers] = await db.query(
                `SELECT travelerId, passportNo, nicNo, nationality, dateOfBirth, emergencyContact, emergencyContactName
                FROM travelers WHERE userId = ?`,
                [user.userId]
            );
            if (travelers.length > 0) {
                user.travelerInfo = travelers[0];
            }
        }

        if (user.userType === 'service_provider') {
            const [providers] = await db.query(
                `SELECT providerId, businessName, providerType, description, address, 
                        locationLat, locationLng, overallRating, totalReviews, isApproved
                FROM service_providers WHERE userId = ?`,
                [user.userId]
            );
            if (providers.length > 0) {
                user.providerInfo = providers[0];
            }
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        next(error);
    }
};

/**
 * Update user profile
 * PATCH /api/auth/profile
 */
exports.updateProfile = async (req, res, next) => {
    try {
        const firebaseUid = req.user.uid;
        const { firstName, lastName, contactNo, profileImage, gender } = req.body;

        const [result] = await db.query(
            `UPDATE users 
            SET firstName = COALESCE(?, firstName),
                lastName = COALESCE(?, lastName),
                contactNo = COALESCE(?, contactNo),
                profileImage = COALESCE(?, profileImage),
                gender = COALESCE(?, gender)
            WHERE firebaseUid = ?`,
            [firstName, lastName, contactNo, profileImage, gender, firebaseUid]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Update profile error:', error);
        next(error);
    }
};

/**
 * Update traveler specific info
 * PATCH /api/auth/traveler-info
 */
exports.updateTravelerInfo = async (req, res, next) => {
    try {
        const firebaseUid = req.user.uid;
        const { passportNo, nicNo, nationality, dateOfBirth, emergencyContact, emergencyContactName } = req.body;

        // Get userId
        const [users] = await db.query(
            'SELECT userId, userType FROM users WHERE firebaseUid = ?',
            [firebaseUid]
        );

        if (users.length === 0 || users[0].userType !== 'traveler') {
            return res.status(403).json({
                success: false,
                message: 'Only travelers can update traveler info'
            });
        }

        const [result] = await db.query(
            `UPDATE travelers 
            SET passportNo = COALESCE(?, passportNo),
                nicNo = COALESCE(?, nicNo),
                nationality = COALESCE(?, nationality),
                dateOfBirth = COALESCE(?, dateOfBirth),
                emergencyContact = COALESCE(?, emergencyContact),
                emergencyContactName = COALESCE(?, emergencyContactName)
            WHERE userId = ?`,
            [passportNo, nicNo, nationality, dateOfBirth, emergencyContact, emergencyContactName, users[0].userId]
        );

        res.json({
            success: true,
            message: 'Traveler info updated successfully'
        });
    } catch (error) {
        console.error('Update traveler info error:', error);
        next(error);
    }
};

/**
 * Delete user account
 * DELETE /api/auth/account
 */
exports.deleteAccount = async (req, res, next) => {
    try {
        const firebaseUid = req.user.uid;

        // Delete from database (cascade will handle related tables)
        const [result] = await db.query(
            'DELETE FROM users WHERE firebaseUid = ?',
            [firebaseUid]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Also delete from Firebase Authentication
        try {
            await auth.deleteUser(firebaseUid);
        } catch (firebaseError) {
            console.error('Firebase delete user error:', firebaseError);
            // Continue even if Firebase deletion fails
        }

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        next(error);
    }
};

/**
 * Check if user exists in database
 * GET /api/auth/check/:firebaseUid
 */
exports.checkUser = async (req, res, next) => {
    try {
        const { firebaseUid } = req.params;

        const [users] = await db.query(
            'SELECT userId, email, userType, isActive FROM users WHERE firebaseUid = ?',
            [firebaseUid]
        );

        if (users.length === 0) {
            return res.json({
                success: true,
                exists: false
            });
        }

        res.json({
            success: true,
            exists: true,
            data: users[0]
        });
    } catch (error) {
        console.error('Check user error:', error);
        next(error);
    }
};
