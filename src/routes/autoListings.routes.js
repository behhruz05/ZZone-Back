const express = require('express');
const router  = express.Router();

const {
  getAutoListings,
  getAutoListingById,
  syncListings,
} = require('../controllers/autoListings.controller');

const { authenticate } = require('../middleware/auth');
const { authorize }    = require('../middleware/role');

// Public routes
router.get('/',    getAutoListings);
router.get('/:id', getAutoListingById);

// ADMIN only — manual sync trigger
router.post('/sync', authenticate, authorize('ADMIN'), syncListings);

module.exports = router;
