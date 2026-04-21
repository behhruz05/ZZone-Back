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

// DELETE /api/admin/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw new ApiError(404, 'Product not found');

    await Product.findByIdAndDelete(req.params.id);

    res.json(new ApiResponse(200, null, 'Mahsulot o\'chirildi'));
  } catch (err) {
    next(err);
  }
};

// ─── Stores ───────────────────────────────────────────────────────────────────

// POST /api/admin/stores  — admin creates a seller account + store in one step
// Body: { sellerName, sellerEmail, sellerPassword, name, description? }
const createStoreForSeller = async (req, res, next) => {
  try {
    const { sellerName, sellerEmail, sellerPassword, name, description } = req.body;

    if (!sellerName || !sellerEmail || !sellerPassword || !name) {
      throw new ApiError(400, 'sellerName, sellerEmail, sellerPassword and name are required');
    }

    const exists = await User.findOne({ email: sellerEmail.toLowerCase() });
    if (exists) throw new ApiError(409, 'Bu email allaqachon ro\'yxatdan o\'tgan');

    const seller = await User.create({
      name:     sellerName.trim(),
      email:    sellerEmail.toLowerCase().trim(),
      password: sellerPassword,
      role:     'SELLER',
    });

    const store = await Store.create({
      seller:      seller._id,
      name:        name.trim(),
      description: description ? description.trim() : undefined,
      isActive:    true,
    });

    res.status(201).json(
      new ApiResponse(201, { seller: { id: seller._id, name: seller.name, email: seller.email }, store }, 'Sotuvchi va do\'kon muvaffaqiyatli yaratildi')
    );
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

// GET /api/admin/users  — all users
const getSellers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter, 'name email role balance isBlocked createdAt')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json(new ApiResponse(200, {
      users,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    }));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/block
const toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, 'User not found');
    if (user.role === 'ADMIN') throw new ApiError(400, 'Admin hisobini bloklash mumkin emas');

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json(new ApiResponse(200, { user: { _id: user._id, isBlocked: user.isBlocked } },
      user.isBlocked ? 'Foydalanuvchi bloklandi' : 'Foydalanuvchi blokdan chiqarildi'
    ));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/balance
// Body: { amount: number, mode?: 'add' | 'set' }
// mode='add' (default): adds amount to current balance (can be negative to deduct)
// mode='set': sets balance to exact amount
const updateUserBalance = async (req, res, next) => {
  try {
    const { amount, mode = 'add' } = req.body;

    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new ApiError(400, "amount raqam bo'lishi kerak");
    }
    if (!['add', 'set'].includes(mode)) {
      throw new ApiError(400, "mode 'add' yoki 'set' bo'lishi kerak");
    }

    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, 'Foydalanuvchi topilmadi');

    let newBalance;
    if (mode === 'set') {
      if (amount < 0) throw new ApiError(400, "Balans manfiy bo'lishi mumkin emas");
      newBalance = amount;
    } else {
      newBalance = user.balance + amount;
      if (newBalance < 0) {
        throw new ApiError(400, `Yetarli balans yo'q. Joriy balans: ${user.balance.toLocaleString()} so'm`);
      }
    }

    user.balance = newBalance;
    await user.save();

    res.json(
      new ApiResponse(
        200,
        { userId: user._id, previousBalance: user.balance - (mode === 'add' ? amount : 0), newBalance: user.balance },
        mode === 'set'
          ? `Balans ${newBalance.toLocaleString()} so'mga o'rnatildi`
          : `Balans ${amount >= 0 ? '+' : ''}${amount.toLocaleString()} so'm o'zgartirildi`
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

// GET /api/admin/products  — all products with optional status filter
const getAllProducts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('seller', 'name email')
        .populate('store', 'name')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
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

module.exports = {
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
};
