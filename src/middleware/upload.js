const multer                  = require('multer');
const { CloudinaryStorage }   = require('multer-storage-cloudinary');
const cloudinary              = require('../config/cloudinary');
const ApiError                = require('../utils/ApiError');

// ─── File filter ──────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only image files (jpg, png, webp) are allowed'), false);
  }
};

// ─── Cloudinary storage factory ───────────────────────────────────────────────
// Files are uploaded directly to Cloudinary — no local disk involved.
// Returns permanent HTTPS URLs that survive deploys.
const makeCloudinaryStorage = (folder) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder:          `zzone/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation:  [{ quality: 'auto', fetch_format: 'auto' }],
    },
  });

// ─── Multer wrapper ───────────────────────────────────────────────────────────
const wrapMulter = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof ApiError)         return next(err);
      if (err.code === 'LIMIT_FILE_SIZE')  return next(new ApiError(400, 'File too large (max 5 MB)'));
      if (err.code === 'LIMIT_FILE_COUNT') return next(new ApiError(400, 'Too many files (max 10)'));
      return next(new ApiError(400, err.message));
    }

    // CloudinaryStorage sets file.path to the secure_url automatically.
    if (req.files && Array.isArray(req.files)) {
      req.files = req.files.map((f) => ({ ...f, path: f.path || f.secure_url }));
    }
    if (req.file) {
      req.file.path = req.file.path || req.file.secure_url;
    }

    next();
  });
};

// ─── Exported middleware ──────────────────────────────────────────────────────

// Product images — up to 10, field name: "images", max 5 MB each
const uploadProductImages = wrapMulter(
  multer({
    storage:    makeCloudinaryStorage('products'),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  }).array('images', 10)
);

// Store logo — single file, field name: "logo", max 2 MB
const uploadLogo = wrapMulter(
  multer({
    storage:    makeCloudinaryStorage('logos'),
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
  }).single('logo')
);

module.exports = { uploadProductImages, uploadLogo };
