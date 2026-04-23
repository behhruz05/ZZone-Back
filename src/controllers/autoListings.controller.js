const AutoListing      = require('../models/AutoListing');
const ApiError         = require('../utils/ApiError');
const ApiResponse      = require('../utils/ApiResponse');
const { fetchAndSave } = require('../services/olx.service');

// ─── GET /api/auto-listings  (Public) ─────────────────────────────────────────
// Query params: minPrice, maxPrice, bodyType, transmission, minYear, maxYear,
//               page (default 1), limit (default 20)
const getAutoListings = async (req, res, next) => {
  try {
    const {
      minPrice, maxPrice,
      bodyType, transmission,
      minYear,  maxYear,
      page  = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    // Price range
    if (minPrice || maxPrice) {
      filter['price.value'] = {};
      if (minPrice) filter['price.value'].$gte = Number(minPrice);
      if (maxPrice) filter['price.value'].$lte = Number(maxPrice);
    }

    // Year range
    if (minYear || maxYear) {
      filter['params.year'] = {};
      if (minYear) filter['params.year'].$gte = Number(minYear);
      if (maxYear) filter['params.year'].$lte = Number(maxYear);
    }

    // Exact match filters (case-insensitive)
    if (bodyType) {
      filter['params.bodyType'] = { $regex: bodyType, $options: 'i' };
    }
    if (transmission) {
      filter['params.transmission'] = { $regex: transmission, $options: 'i' };
    }

    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [listings, total] = await Promise.all([
      AutoListing.find(filter)
        .sort({ olxCreatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AutoListing.countDocuments(filter),
    ]);

    res.json(new ApiResponse(200, {
      listings,
      pagination: {
        total,
        page:  pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum,
      },
    }));
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/auto-listings/:id  (Public) ─────────────────────────────────────
const getAutoListingById = async (req, res, next) => {
  try {
    const listing = await AutoListing.findById(req.params.id).lean();
    if (!listing) throw new ApiError(404, 'Auto listing not found');
    res.json(new ApiResponse(200, { listing }));
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auto-listings/sync  (ADMIN only) ───────────────────────────────
const syncListings = async (req, res, next) => {
  try {
    const stats = await fetchAndSave();
    res.json(new ApiResponse(200, { stats }, 'OLX sync completed successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAutoListings,
  getAutoListingById,
  syncListings,
};
