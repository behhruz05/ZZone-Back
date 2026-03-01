const jwt   = require('jsonwebtoken');
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

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

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

    const user  = await User.create({ name, email, password, role: role || 'CLIENT' });
    const token = generateToken(user._id);

    res.status(201).json(
      new ApiResponse(201, { token, user: safeUser(user) }, 'Registration successful')
    );
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // select:false on password — must explicitly include it
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = generateToken(user._id);

    res.json(
      new ApiResponse(200, { token, user: safeUser(user) }, 'Login successful')
    );
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

module.exports = { register, login, getMe, registerValidation, loginValidation };
