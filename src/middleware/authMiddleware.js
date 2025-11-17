const { auth } = require('../config/firebase');

/**
 * Middleware to verify Firebase ID token
 */
const authenticateUser = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }

        const idToken = authHeader.split('Bearer ')[1];

        // Verify the token with Firebase
        const decodedToken = await auth.verifyIdToken(idToken);
        
        // Attach user info to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error.message);
        
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                success: false,
                message: 'Authentication token expired'
            });
        }
        
        return res.status(401).json({
            success: false,
            message: 'Invalid authentication token'
        });
    }
};

/**
 * Middleware to check user role (optional)
 */
const checkRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            const db = require('../config/database');
            const [users] = await db.query(
                'SELECT userType FROM users WHERE firebaseUid = ?',
                [req.user.uid]
            );

            if (users.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const userType = users[0].userType;

            if (!allowedRoles.includes(userType)) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Insufficient permissions.'
                });
            }

            req.user.userType = userType;
            next();
        } catch (error) {
            console.error('Role check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error checking user permissions'
            });
        }
    };
};

module.exports = {
    authenticateUser,
    checkRole
};
