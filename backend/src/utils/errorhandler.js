// utils/errorHandler.js
/**
 * Custom error handler for the VR content platform API
 * This handler formats error responses in a consistent way
 */

// Custom error class
class APIError extends Error {
    constructor(statusCode, message, errorCode = 'UNKNOWN_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
    }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error('API Error:', err);

    // Default error status and message
    const statusCode = err.statusCode || 500;
    const errorCode = err.errorCode || 'SERVER_ERROR';
    
    // Translate error message if i18n is available
    const message = req.__ ? req.__(errorCode, err.message) : err.message;
    
    res.status(statusCode).json({
        success: false,
        error: errorCode,
        message: message
    });
};

// Not found middleware
const notFoundHandler = (req, res, next) => {
    const error = new APIError(404, `路径 ${req.originalUrl} 不存在`, 'NOT_FOUND');
    next(error);
};

module.exports = {
    APIError,
    errorHandler,
    notFoundHandler
};