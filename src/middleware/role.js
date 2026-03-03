const ApiError = require('../utils/ApiError');

/**
 * Role-based access control middleware.
 * Must be used after authenticate middleware.
 *
 * Usage: authorize('ADMIN', 'SELLER')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Acceddddddss denied. Allowed roles: ${roles.join(', ')}`)
      );
    }
    next();
  };
};

module.exports = { authorize };
