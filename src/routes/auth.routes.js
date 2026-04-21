const express = require('express');
const router  = express.Router();

const {
  register,
  login,
  refresh,
  logout,
  getMe,
  registerValidation,
  loginValidation,
} = require('../controllers/auth.controller');

const { authenticate } = require('../middleware/auth');
const validate         = require('../middleware/validate');

// POST /api/auth/register
router.post('/register', registerValidation, validate, register);

// POST /api/auth/login
router.post('/login', loginValidation, validate, login);

// POST /api/auth/refresh  — exchange refreshToken for new access token
router.post('/refresh', refresh);

// POST /api/auth/logout  — invalidate refreshToken
router.post('/logout', authenticate, logout);

// GET /api/auth/me  — returns current user info
router.get('/me', authenticate, getMe);

module.exports = router;
