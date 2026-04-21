const express = require('express');
const router  = express.Router();

const {
  getPendingProducts,
  approveProduct,
  rejectProduct,
  deleteProduct,
  getAllProducts,
  createStoreForSeller,
  getAllStores,
  getSellers,
  toggleBlockUser,
  updateUserBalance,
  getStats,
} = require('../controllers/admin.controller');

const { authenticate } = require('../middleware/auth');
const { authorize }    = require('../middleware/role');

// All admin routes require authentication + ADMIN role
router.use(authenticate, authorize('ADMIN'));

// Dashboard
router.get('/stats', getStats);

// Product moderation
router.get('/products/pending',         getPendingProducts);
router.get('/products',                 getAllProducts);
router.patch('/products/:id/approve',   approveProduct);
router.patch('/products/:id/reject',    rejectProduct);
router.delete('/products/:id',          deleteProduct);

// Store management
router.post('/stores', createStoreForSeller);
router.get('/stores', getAllStores);

// User management
router.get('/users', getSellers);
router.patch('/users/:id/balance', updateUserBalance);
router.patch('/users/:id/block',   toggleBlockUser);

module.exports = router;
