const express = require('express');
const router  = express.Router();

const {
  createProduct,
  getProducts,
  getMyProducts,
  getProductById,
  productValidation,
} = require('../controllers/product.controller');

const { authenticate }        = require('../middleware/auth');
const { authorize }           = require('../middleware/role');
const { uploadProductImages } = require('../middleware/upload');
const validate                = require('../middleware/validate');

// IMPORTANT: /my must come before /:id
// GET /api/products  — public, approved products with filters
router.get('/', getProducts);

// GET /api/products/my  — seller sees all their products (any status)
router.get('/my', authenticate, authorize('SELLER'), getMyProducts);

// POST /api/products  — create product (images optional)
router.post(
  '/',
  authenticate,
  authorize('SELLER'),
  uploadProductImages, // parses multipart/form-data, saves images to local disk
  productValidation,
  validate,
  createProduct
);

// GET /api/products/:id  — public, single approved product
router.get('/:id', getProductById);

module.exports = router;
