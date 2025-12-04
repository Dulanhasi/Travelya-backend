// middleware/errorHandler.js
/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'Duplicate entry. This record already exists.';
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message = 'Invalid reference. Related record does not exist.';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  // JWT errors (if you use jsonwebtoken somewhere)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Firebase auth errors (common shapes)
  // firebase-admin verifyIdToken throws Error objects that may have code like 'auth/id-token-expired'
  if (err.code && typeof err.code === 'string' && err.code.startsWith('auth/')) {
    // treat firebase auth errors as 401 Unauthorized
    statusCode = 401;
    // Map a couple well-known codes to friendlier messages
    if (err.code === 'auth/id-token-expired') {
      message = 'Authentication token expired';
    } else if (err.code === 'auth/argument-error') {
      message = 'Invalid authentication token';
    } else {
      message = err.message || 'Authentication error';
    }
  }

  // If the middleware already set statusCode/message, preserve it (above takes precedence)

  // Send error response
  const payload = {
    success: false,
    message
  };

  if (process.env.NODE_ENV === 'development') {
    payload.stack = err.stack;
    payload.error = err;
  }

  res.status(statusCode).json(payload);
};

module.exports = errorHandler;


// /**
//  * Centralized error handling middleware
//  */
// const errorHandler = (err, req, res, next) => {
//     console.error('Error:', err);

//     // Default error
//     let statusCode = err.statusCode || 500;
//     let message = err.message || 'Internal Server Error';

//     // MySQL errors
//     if (err.code === 'ER_DUP_ENTRY') {
//         statusCode = 409;
//         message = 'Duplicate entry. This record already exists.';
//     }

//     if (err.code === 'ER_NO_REFERENCED_ROW_2') {
//         statusCode = 400;
//         message = 'Invalid reference. Related record does not exist.';
//     }

//     // Validation errors
//     if (err.name === 'ValidationError') {
//         statusCode = 400;
//         message = err.message;
//     }

//     // JWT errors
//     if (err.name === 'JsonWebTokenError') {
//         statusCode = 401;
//         message = 'Invalid token';
//     }

//     if (err.name === 'TokenExpiredError') {
//         statusCode = 401;
//         message = 'Token expired';
//     }

//     // Send error response
//     res.status(statusCode).json({
//         success: false,
//         message: message,
//         ...(process.env.NODE_ENV === 'development' && { 
//             stack: err.stack,
//             error: err 
//         })
//     });
// };

// module.exports = errorHandler;
