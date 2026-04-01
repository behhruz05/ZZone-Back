const express = require('express');
const router  = express.Router();

const {
  getMyStore,
  getStoreById,
  activateStorePlan,
  getPlans,
} = require('../controllers/store.controller');

const { authenticate } = require('../middleware/auth');
const { authorize }    = require('../middleware/role');

// IMPORTANT: named routes (/plans, /my) must come before /:id to avoid
// Express treating "plans" or "my" as an id parameter.

// GET /api/stores/plans  — public, lists plan pricing
router.get('/plans', getPlans);

// GET /api/stores/my  — seller's own store
router.get('/my', authenticate, authorize('SELLER'), getMyStore);

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
