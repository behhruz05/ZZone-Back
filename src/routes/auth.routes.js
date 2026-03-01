const express = require('express');
const router  = express.Router();

const {
  register,
  login,
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

// GET /api/auth/me  — returns current user info
router.get('/me', authenticate, getMe);

module.exports = router;
