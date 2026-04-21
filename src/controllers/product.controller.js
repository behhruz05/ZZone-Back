const { body } = require('express-validator');

const Product     = require('../models/Product');
const Store       = require('../models/Store');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Haversine formula — returns distance in km between two lat/lng points
function haversineKm(lat1, lon1, lat2, lon2) {
  const R   = 6371;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('description').optional().trim(),
];

// ─── Controllers ──────────────────────────────────────────────────────────────

// POST /api/products  (SELLER only)
const createProduct = async (req, res, next) => {
  try {
    const store = await Store.findOne({ seller: req.user._id });
    if (!store) throw new ApiError(404, 'Create a store first');

    const { name, description, price, category } = req.body;
    const images = req.files ? req.files.map((f) => f.path) : [];

    const product = await Product.create({
      store:       store._id,
      seller:      req.user._id,
      name, description, price, category, images,
      status: 'APPROVED',
    });

    res.status(201).json(new ApiResponse(201, { product }, 'Product added successfully'));
  } catch (err) {
    next(err);
  }
};

// GET /api/products  (Public — APPROVED products)
// Query params: category, minPrice, maxPrice, search, page, limit, lat, lng
const getProducts = async (req, res, next) => {
  try {
    const {
      category, minPrice, maxPrice,
      page  = 1,
      limit = 20,
      search,
      lat, lng,
    } = req.query;

    // ── Build MongoDB filter ─────────────────────────────────────
    const filter = { status: 'APPROVED' };

    if (category) filter.category = category;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Text search: name OR description OR category (case-insensitive)
    if (search && search.trim()) {
      const re = { $regex: search.trim(), $options: 'i' };
      filter.$or = [{ name: re }, { description: re }, { category: re }];
    }

    const skip = (Number(page) - 1) * Number(limit);

    // ── Location-based sort (distance ↑, then price ↑) ───────────
    if (lat && lng) {
      const userLat = Number(lat);
      const userLng = Number(lng);

      if (isNaN(userLat) || isNaN(userLng)) {
        return next(new ApiError(400, 'Invalid lat/lng'));
      }

      // Fetch active stores that have a location
      const stores = await Store.find({
        isActive: true,
        'location.lat': { $ne: null },
        'location.lng': { $ne: null },
      }).select('_id location');

      // Build distance map: storeId → km
      const distMap = new Map();
      for (const s of stores) {
        const km = haversineKm(userLat, userLng, s.location.lat, s.location.lng);
        distMap.set(s._id.toString(), km);
      }

      // Get ALL matching products (no skip/limit yet — we sort in JS)
      const allProducts = await Product.find(filter)
        .populate('store', 'name logo isActive location description');

      // Sort: nearest store first, then cheapest price
      allProducts.sort((a, b) => {
        const dA = distMap.get(a.store._id.toString()) ?? Infinity;
        const dB = distMap.get(b.store._id.toString()) ?? Infinity;
        if (Math.abs(dA - dB) > 0.05) return dA - dB;  // different store → by distance
        return a.price - b.price;                        // same-distance store → cheapest first
      });

      const total    = allProducts.length;
      const paginated = allProducts.slice(skip, skip + Number(limit));

      // Attach distance string to each product object
      const products = paginated.map((p) => {
        const obj = p.toObject();
        const km  = distMap.get(p.store._id.toString());
        if (km !== undefined) {
          obj.distance    = km;
          obj.distanceStr = formatDistance(km);
        }
        return obj;
      });

      return res.json(new ApiResponse(200, {
        products,
        pagination: {
          total,
          page:  Number(page),
          pages: Math.ceil(total / Number(limit)) || 1,
          limit: Number(limit),
        },
        locationUsed: true,
      }));
    }

    // ── Default sort (newest first) ──────────────────────────────
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('store', 'name logo isActive description')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json(new ApiResponse(200, {
      products,
      pagination: {
        total,
        page:  Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
        limit: Number(limit),
      },
      locationUsed: false,
    }));
  } catch (err) {
    next(err);
  }
};

// GET /api/products/my  (SELLER only)
const getMyProducts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { seller: req.user._id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json(new ApiResponse(200, {
      products,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    }));
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id  (Public)
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({
      _id:    req.params.id,
      status: 'APPROVED',
    }).populate('store', 'name logo description location');

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
