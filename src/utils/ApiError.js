/**
 * Custom error class for API errors.
 * Carries HTTP status code and optional validation errors array.
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors     = errors;
    this.success    = false;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
