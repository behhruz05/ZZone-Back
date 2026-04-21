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

    const { name, description, locationLat, locationLng, locationAddress } = req.body;
    const logoUrl = req.file ? req.file.path : null;

    const store = await Store.create({
      seller: req.user._id,
      name,
      description,
      logo: logoUrl,
      location: {
        lat:     locationLat     ? parseFloat(locationLat)     : null,
        lng:     locationLng     ? parseFloat(locationLng)     : null,
        address: locationAddress ? locationAddress.trim()      : null,
      },
    });

    res.status(201).json(
      new ApiResponse(201, { store }, 'Store created. Activate a subscription to start selling.')
    );
  } catch (err) {
    next(err);
  }
};

// PATCH /api/stores/my  (SELLER only) — update description + contacts
const updateMyStoreInfo = async (req, res, next) => {
  try {
    const store = await Store.findOne({ seller: req.user._id });
    if (!store) throw new ApiError(404, 'You do not have a store yet');

    const { description, phone, telegram, instagram, whatsapp } = req.body;

    if (description !== undefined) store.description = description.trim() || null;
    if (!store.contacts) store.contacts = {};
    if (phone     !== undefined) store.contacts.phone     = phone?.trim()     || null;
    if (telegram  !== undefined) store.contacts.telegram  = telegram?.trim()  || null;
    if (instagram !== undefined) store.contacts.instagram = instagram?.trim() || null;
    if (whatsapp  !== undefined) store.contacts.whatsapp  = whatsapp?.trim()  || null;

    await store.save();
    res.json(new ApiResponse(200, { store }, "Do'kon ma'lumotlari yangilandi"));
  } catch (err) {
    next(err);
  }
};

// PUT /api/stores/my/location  (SELLER only)
const updateMyStoreLocation = async (req, res, next) => {
  try {
    const store = await Store.findOne({ seller: req.user._id });
    if (!store) throw new ApiError(404, 'You do not have a store yet');

    const { lat, lng, address } = req.body;

    store.location = {
      lat:     lat     ? parseFloat(lat)     : null,
      lng:     lng     ? parseFloat(lng)     : null,
      address: address ? address.trim()      : null,
    };
    await store.save();

    res.json(new ApiResponse(200, { store }, 'Location updated'));
  } catch (err) {
    next(err);
  }
};

// GET /api/stores  (Public — active stores with location for map)
const getActiveStores = async (req, res, next) => {
  try {
    const stores = await Store.find({ isActive: true })
      .populate('seller', 'name')
      .select('name description logo location subscriptionPlan contacts seller');

    res.json(new ApiResponse(200, { stores }));
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
  updateMyStoreInfo,
  updateMyStoreLocation,
  getActiveStores,
  activateStorePlan,
  getPlans,
  storeValidation,
};
