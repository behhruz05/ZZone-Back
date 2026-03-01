const express = require('express');
const router  = express.Router();

const {
  createStore,
  getMyStore,
  getStoreById,
  activateStorePlan,
  getPlans,
  storeValidation,
} = require('../controllers/store.controller');

const { authenticate } = require('../middleware/auth');
const { authorize }    = require('../middleware/role');
const { uploadLogo }   = require('../middleware/upload');
const validate         = require('../middleware/validate');

// IMPORTANT: named routes (/plans, /my) must come before /:id to avoid
// Express treating "plans" or "my" as an id parameter.

// GET /api/stores/plans  — public, lists plan pricing
router.get('/plans', getPlans);

// GET /api/stores/my  — seller's own store
router.get('/my', authenticate, authorize('SELLER'), getMyStore);

// POST /api/stores  — create store (logo upload optional)
router.post(
  '/',
  authenticate,
  authorize('SELLER'),
  uploadLogo,          // multer middleware — parses multipart/form-data
  storeValidation,
  validate,
  createStore
);

// POST /api/stores/subscription  — activate or renew subscription
router.post(
  '/subscription',
  authenticate,
  authorize('SELLER'),
  activateStorePlan
);

// GET /api/stores/:id  — public store page
router.get('/:id', getStoreById);

module.exports = router;
