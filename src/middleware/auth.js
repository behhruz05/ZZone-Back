const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * Verifies JWT from Authorization header and attaches user to req.user.
 * Expected header: Authorization: Bearer <token>
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication token required');
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError(401, 'User no longer exists');
    if (user.isBlocked) throw new ApiError(403, 'Sizning hisobingiz bloklangan');

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate };
