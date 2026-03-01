const { body } = require('express-validator');

const Store       = require('../models/Store');
const ApiError    = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { activateSubscription } = require('../services/subscription.service');
const { SUBSCRIPTION_PLANS }   = require('../utils/constants');

// ─── Validation ───────────────────────────────────────────────────────────────

const storeValidation = [
  body('name').trim().notEmpty().withMessage('Store name is required'),
  body('description').optional().trim(),
];

// ─── Controllers ──────────────────────────────────────────────────────────────

// POST /api/stores  (SELLER only)
const createStore = async (req, res, next) => {
  try {
    const exists = await Store.findOne({ seller: req.user._id });
    if (exists) throw new ApiError(409, 'You already have a store');

    const { name, description } = req.body;
    const logoUrl = req.file ? req.file.path : null; // local upload URL e.g. /uploads/logos/logo-<hex>.jpg

    const store = await Store.create({
      seller: req.user._id,
      name,
      description,
      logo: logoUrl,
    });

    res.status(201).json(
      new ApiResponse(201, { store }, 'Store created. Activate a subscription to start selling.')
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/stores/my  (SELLER only)
const getMyStore = async (req, res, next) => {
  try {
    const store = await Store.findOne({ seller: req.user._id });
    if (!store) throw new ApiError(404, 'You do not have a store yet');
    res.json(new ApiResponse(200, { store }));
  } catch (err) {
    next(err);
  }
};

// GET /api/stores/:id  (Public)
const getStoreById = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id).populate('seller', 'name');
    if (!store) throw new ApiError(404, 'Store not found');
    res.json(new ApiResponse(200, { store }));
  } catch (err) {
    next(err);
  }
};

// POST /api/stores/subscription  (SELLER only)
// Body: { plan: 'TRIAL' | 'BASIC' | 'STANDARD' | 'PREMIUM' }
const activateStorePlan = async (req, res, next) => {
  try {
    const { plan } = req.body;

    if (!plan || !SUBSCRIPTION_PLANS[plan]) {
      throw new ApiError(
        400,
        `Invalid plan. Available: ${Object.keys(SUBSCRIPTION_PLANS).join(', ')}`
      );
    }

    const store = await Store.findOne({ seller: req.user._id });
    if (!store) throw new ApiError(404, 'Create a store first');

    const result = await activateSubscription(plan, store._id, req.user._id);

    res.json(
      new ApiResponse(
        200,
        { store: result.store, newBalance: result.newBalance },
        `Plan "${plan}" activated successfully`
      )
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/stores/plans  (Public — shows plan pricing)
const getPlans = async (req, res, next) => {
  try {
    const plans = Object.entries(SUBSCRIPTION_PLANS).map(([name, details]) => ({
      name,
      ...details,
    }));
    res.json(new ApiResponse(200, { plans }));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createStore,
  getMyStore,
  getStoreById,
  activateStorePlan,
  getPlans,
  storeValidation,
};
