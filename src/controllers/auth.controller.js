const jwt    = require('jsonwebtoken');
const crypto = require('crypto');
const { body } = require('express-validator');

const User        = require('../models/User');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ─── Validation chains ────────────────────────────────────────────────────────

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['SELLER', 'CLIENT']).withMessage('Role must be SELLER or CLIENT'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });

const generateRefreshToken = () => crypto.randomBytes(40).toString('hex');

const safeUser = (user) => ({
  id:        user._id,
  name:      user.name,
  email:     user.email,
  role:      user.role,
  balance:   user.balance,
  trialUsed: user.trialUsed,
});

// ─── Controllers ──────────────────────────────────────────────────────────────

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) throw new ApiError(409, 'Email already registered');

    const refreshToken = generateRefreshToken();
    const user = await User.create({
      name, email, password,
      role:         role || 'CLIENT',
      refreshToken,
    });

    const accessToken = generateAccessToken(user._id);

    res.status(201).json(
      new ApiResponse(201, { token: accessToken, refreshToken, user: safeUser(user) }, 'Registration successful')
    );
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Invalid email or password');
    }
    if (user.isBlocked) {
      throw new ApiError(403, 'Sizning hisobingiz bloklangan. Admin bilan bog\'laning.');
    }

    const refreshToken    = generateRefreshToken();
    user.refreshToken     = refreshToken;
    await user.save();

    const accessToken = generateAccessToken(user._id);

    res.json(
      new ApiResponse(200, { token: accessToken, refreshToken, user: safeUser(user) }, 'Login successful')
    );
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
// Body: { refreshToken: string }
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ApiError(400, 'Refresh token required');

    const user = await User.findOne({ refreshToken }).select('+refreshToken');
    if (!user)          throw new ApiError(401, 'Invalid refresh token');
    if (user.isBlocked) throw new ApiError(403, 'Sizning hisobingiz bloklangan');

    const newRefreshToken = generateRefreshToken();
    user.refreshToken     = newRefreshToken;
    await user.save();

    const accessToken = generateAccessToken(user._id);

    res.json(
      new ApiResponse(200, { token: accessToken, refreshToken: newRefreshToken }, 'Token refreshed')
    );
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout  (requires authenticate middleware)
const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json(new ApiResponse(200, null, 'Logged out successfully'));
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me  (requires authenticate middleware)
const getMe = async (req, res, next) => {
  try {
    res.json(new ApiResponse(200, { user: safeUser(req.user) }));
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout, getMe, registerValidation, loginValidation };
