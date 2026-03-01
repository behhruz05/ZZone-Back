const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Reads express-validator results and throws ApiError if validation failed.
 * Place this after validation chain middleware.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field:   e.path,
      message: e.msg,
    }));
    return next(new ApiError(400, 'Validation failed', formatted));
  }
  next();
};

module.exports = validate;
