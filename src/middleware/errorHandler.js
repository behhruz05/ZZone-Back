const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';
  let errors     = err.errors     || [];

  // ─── Mongoose validation error ────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message    = 'Validation failed';
    errors     = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
  }

  // ─── Mongoose duplicate key (e.g. unique email) ───────────────────────────
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `${field} already exists`;
  }

  // ─── Mongoose invalid ObjectId ────────────────────────────────────────────
  if (err.name === 'CastError') {
    statusCode = 400;
    message    = `Invalid ${err.path}: ${err.value}`;
  }

  // ─── JWT errors ───────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Token expired. Please log in again';
  }

  // ─── Multer errors ────────────────────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE')  { statusCode = 400; message = 'File size exceeds limit'; }
  if (err.code === 'LIMIT_FILE_COUNT') { statusCode = 400; message = 'Too many files uploaded';  }

  if (statusCode >= 500) {
    logger.error({ err, method: req.method, url: req.url }, 'Server error');
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
