const { body } = require('express-validator');

const Product     = require('../models/Product');
const Store       = require('../models/Store');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ─── Validation ───────────────────────────────────────────────────────────────

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('description').optional().trim(),
];

// ─── Controllers ──────────────────────────────────────────────────────────────

// POST /api/products  (SELLER only)
const createProduct = async (req, res, next) => {
  try {
    const store = await Store.findOne({ seller: req.user._id });
    if (!store) throw new ApiError(404, 'Create a store first');

    // Store must have an active subscription to list products
    if (!store.isActive) {
      throw new ApiError(
        403,
        'Your store subscription is inactive. Activate a plan to add products.'
      );
    }

    const { name, description, price, category } = req.body;
    // req.files comes from multer array upload
    const images = req.files ? req.files.map((f) => f.path) : [];

    const product = await Product.create({
      store:       store._id,
      seller:      req.user._id,
      name,
      description,
      price,
      category,
      images,
      // status defaults to PENDING — admin must approve
    });

    res.status(201).json(
      new ApiResponse(201, { product }, 'Product submitted for admin approval')
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/products  (Public — only APPROVED products)
// Query params: category, minPrice, maxPrice, page, limit, sort
const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      page  = 1,
      limit = 20,
      sort  = '-createdAt',
    } = req.query;

    const filter = { status: 'APPROVED' };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('store', 'name logo isActive')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json(
      new ApiResponse(200, {
        products,
        pagination: {
          total,
          page:  Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit),
        },
      })
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/products/my  (SELLER only — all their products regardless of status)
const getMyProducts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { seller: req.user._id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json(
      new ApiResponse(200, {
        products,
        pagination: {
          total,
          page:  Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
      })
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id  (Public — only APPROVED)
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id:    req.params.id,
      status: 'APPROVED',
    }).populate('store', 'name logo description');

    if (!product) throw new ApiError(404, 'Product not found');

    res.json(new ApiResponse(200, { product }));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getMyProducts,
  getProductById,
  productValidation,
};
