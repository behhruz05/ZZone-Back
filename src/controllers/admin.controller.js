const Product     = require('../models/Product');
const Store       = require('../models/Store');
const User        = require('../models/User');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ─── Products ─────────────────────────────────────────────────────────────────

// GET /api/admin/products/pending
const getPendingProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find({ status: 'PENDING' })
        .populate('seller', 'name email')
        .populate('store', 'name')
        .sort('createdAt') // Oldest first — fair queue
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments({ status: 'PENDING' }),
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

// PATCH /api/admin/products/:id/approve
const approveProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw new ApiError(404, 'Product not found');
    if (product.status !== 'PENDING') {
      throw new ApiError(400, `Product is already ${product.status}`);
    }

    product.status          = 'APPROVED';
    product.rejectionReason = null;
    await product.save();

    res.json(new ApiResponse(200, { product }, 'Product approved'));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/products/:id/reject
// Body: { reason: string }
const rejectProduct = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      throw new ApiError(400, 'Rejection reason is required');
    }

    const product = await Product.findById(req.params.id);
    if (!product) throw new ApiError(404, 'Product not found');
    if (product.status !== 'PENDING') {
      throw new ApiError(400, `Product is already ${product.status}`);
    }

    product.status          = 'REJECTED';
    product.rejectionReason = reason.trim();
    await product.save();

    res.json(new ApiResponse(200, { product }, 'Product rejected'));
  } catch (err) {
    next(err);
  }
};

// ─── Stores ───────────────────────────────────────────────────────────────────

// POST /api/admin/stores  — admin creates a store for a specific seller
// Body: { sellerId, name, description? }
const createStoreForSeller = async (req, res, next) => {
  try {
    const { sellerId, name, description } = req.body;

    if (!sellerId || !name) {
      throw new ApiError(400, 'sellerId and name are required');
    }

    const seller = await User.findById(sellerId);
    if (!seller) throw new ApiError(404, 'User not found');
    if (seller.role !== 'SELLER') throw new ApiError(400, 'User is not a SELLER');

    const exists = await Store.findOne({ seller: sellerId });
    if (exists) throw new ApiError(409, 'This seller already has a store');

    const store = await Store.create({
      seller:   sellerId,
      name:     name.trim(),
      description: description ? description.trim() : undefined,
      isActive: true,
    });

    res.status(201).json(new ApiResponse(201, { store }, 'Store created for seller'));
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/stores  (optional ?isActive=true|false)
const getAllStores = async (req, res, next) => {
  try {
    const { isActive, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const [stores, total] = await Promise.all([
      Store.find(filter)
        .populate('seller', 'name email balance trialUsed')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Store.countDocuments(filter),
    ]);

    res.json(
      new ApiResponse(200, {
        stores,
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

// ─── Users ────────────────────────────────────────────────────────────────────

// GET /api/admin/users  — sellers without a store (for store creation UI)
const getSellers = async (req, res, next) => {
  try {
    const sellers = await User.find({ role: 'SELLER' }, 'name email _id createdAt');
    const storeSellerIds = (await Store.find({}, 'seller')).map((s) => String(s.seller));
    const withoutStore = sellers.filter((u) => !storeSellerIds.includes(String(u._id)));
    res.json(new ApiResponse(200, { sellers: withoutStore }));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/balance
// Body: { amount: number }  (positive to add, negative to deduct)
const updateUserBalance = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new ApiError(400, 'amount must be a number');
    }

    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, 'User not found');

    const newBalance = user.balance + amount;
    if (newBalance < 0) {
      throw new ApiError(400, `Cannot deduct ${Math.abs(amount)} — balance would go below 0`);
    }

    user.balance = newBalance;
    await user.save();

    res.json(
      new ApiResponse(
        200,
        { userId: user._id, newBalance: user.balance },
        `Balance updated by ${amount}`
      )
    );
  } catch (err) {
    next(err);
  }
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

// GET /api/admin/stats
const getStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalSellers,
      totalStores,
      activeStores,
      totalProducts,
      pendingProducts,
      approvedProducts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'SELLER' }),
      Store.countDocuments(),
      Store.countDocuments({ isActive: true }),
      Product.countDocuments(),
      Product.countDocuments({ status: 'PENDING' }),
      Product.countDocuments({ status: 'APPROVED' }),
    ]);

    res.json(
      new ApiResponse(200, {
        users:    { total: totalUsers, sellers: totalSellers },
        stores:   { total: totalStores, active: activeStores },
        products: { total: totalProducts, pending: pendingProducts, approved: approvedProducts },
      })
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPendingProducts,
  approveProduct,
  rejectProduct,
  createStoreForSeller,
  getAllStores,
  getSellers,
  updateUserBalance,
  getStats,
};
