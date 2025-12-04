// middleware/authMiddleware.js
const { auth } = require('../config/firebase');
const db = require('../config/database');

/**
 * Middleware to verify Firebase ID token and attach user + related ids
 * - Attaches: uid, email, emailVerified, userId, userType, isAdmin
 * - Optionally attaches: travelerId, providerId, providerIsApproved
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No authentication token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Verify token with Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(idToken);

    // Base fields from token
    const userObj = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      emailVerified: decodedToken.email_verified || false,
      customClaims: decodedToken // keep decoded token for inspection if needed
    };

    // Enrich from users table (lookup by firebaseUid)
    try {
      const [rows] = await db.query(
        'SELECT userId, userType FROM users WHERE firebaseUid = ? LIMIT 1',
        [decodedToken.uid]
      );

      if (rows && rows.length > 0) {
        const userRow = rows[0];
        userObj.userId = userRow.userId;
        userObj.userType = userRow.userType; // 'traveler' | 'service_provider' | 'admin'
        userObj.isAdmin = (userRow.userType && userRow.userType.toString().toLowerCase() === 'admin');
      } else {
        // no DB record found
        userObj.isAdmin = false;
      }
    } catch (dbErr) {
      console.error('authenticateUser - users lookup error:', dbErr);
      // proceed with token-only info
      userObj.isAdmin = false;
    }

    // Optionally attach travelerId if exists
    if (userObj.userId) {
      try {
        const [travRows] = await db.query('SELECT travelerId FROM travelers WHERE userId = ? LIMIT 1', [userObj.userId]);
        if (travRows && travRows.length > 0) {
          userObj.travelerId = travRows[0].travelerId;
        }
      } catch (travErr) {
        console.error('authenticateUser - travelers lookup error:', travErr);
      }

      // Optionally attach service provider info if exists
      try {
        const [provRows] = await db.query(
          'SELECT providerId, isApproved FROM service_providers WHERE userId = ? LIMIT 1',
          [userObj.userId]
        );
        if (provRows && provRows.length > 0) {
          userObj.providerId = provRows[0].providerId;
          // provider's own approval flag (not the same as locations)
          userObj.providerIsApproved = provRows[0].isApproved === 1 || provRows[0].isApproved === true;
        }
      } catch (provErr) {
        console.error('authenticateUser - service_providers lookup error:', provErr);
      }
    }

    // Attach final object
    req.user = userObj;

    return next();
  } catch (error) {
    console.error('Authentication error:', error);

    if (error && error.code === 'auth/id-token-expired') {
      return res.status(401).json({ success: false, message: 'Authentication token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication token' });
  }
};

/**
 * Middleware to check user role (optional)
 * Example usage: router.post('/', authenticateUser, checkRole(['admin']), handler);
 */
const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      // If userType already attached and authorized, continue
      if (req.user.userType && allowedRoles.includes(req.user.userType)) {
        req.user.isAdmin = req.user.userType.toString().toLowerCase() === 'admin';
        return next();
      }

      // Fallback DB lookup for userType
      const [rows] = await db.query('SELECT userType FROM users WHERE firebaseUid = ? LIMIT 1', [req.user.uid]);
      if (!rows || rows.length === 0) {
        return res.status(403).json({ success: false, message: 'User not found' });
      }

      const userType = rows[0].userType;
      if (!allowedRoles.includes(userType)) {
        return res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
      }

      req.user.userType = userType;
      req.user.isAdmin = userType.toString().toLowerCase() === 'admin';
      return next();
    } catch (err) {
      console.error('Role check error:', err);
      return res.status(500).json({ success: false, message: 'Error checking user permissions' });
    }
  };
};

module.exports = {
  authenticateUser,
  checkRole
};



// const { auth } = require('../config/firebase');

// /**
//  * Middleware to verify Firebase ID token
//  */
// const authenticateUser = async (req, res, next) => {
//     try {
//         // Get token from Authorization header
//         const authHeader = req.headers.authorization;
        
//         if (!authHeader || !authHeader.startsWith('Bearer ')) {
//             return res.status(401).json({
//                 success: false,
//                 message: 'No authentication token provided'
//             });
//         }

//         const idToken = authHeader.split('Bearer ')[1];

//         // Verify the token with Firebase
//         const decodedToken = await auth.verifyIdToken(idToken);
        
//         // Attach user info to request
//         req.user = {
//             uid: decodedToken.uid,
//             email: decodedToken.email,
//             emailVerified: decodedToken.email_verified
//         };

//         next();
//     } catch (error) {
//         console.error('Authentication error:', error.message);
        
//         if (error.code === 'auth/id-token-expired') {
//             return res.status(401).json({
//                 success: false,
//                 message: 'Authentication token expired'
//             });
//         }
        
//         return res.status(401).json({
//             success: false,
//             message: 'Invalid authentication token'
//         });
//     }
// };

// /**
//  * Middleware to check user role (optional)
//  */
// const checkRole = (allowedRoles) => {
//     return async (req, res, next) => {
//         try {
//             const db = require('../config/database');
//             const [users] = await db.query(
//                 'SELECT userType FROM users WHERE firebaseUid = ?',
//                 [req.user.uid]
//             );

//             if (users.length === 0) {
//                 return res.status(403).json({
//                     success: false,
//                     message: 'User not found'
//                 });
//             }

//             const userType = users[0].userType;

//             if (!allowedRoles.includes(userType)) {
//                 return res.status(403).json({
//                     success: false,
//                     message: 'Access denied. Insufficient permissions.'
//                 });
//             }

//             req.user.userType = userType;
//             next();
//         } catch (error) {
//             console.error('Role check error:', error);
//             return res.status(500).json({
//                 success: false,
//                 message: 'Error checking user permissions'
//             });
//         }
//     };
// };

// module.exports = {
//     authenticateUser,
//     checkRole
// };
