const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');

const ApiError = require('../utils/ApiError');

// ─── Base URL ─────────────────────────────────────────────────────────────────
// Used to build full image URLs stored in DB.
// Set BASE_URL in .env for production (e.g. https://api.yourdomain.com)
const getBaseUrl = () =>
  process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

// ─── Directories ──────────────────────────────────────────────────────────────
// Resolved relative to project root (back/uploads/...)
const UPLOADS_ROOT = path.join(__dirname, '../../uploads');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Create on startup — never fail because folder is missing
ensureDir(path.join(UPLOADS_ROOT, 'products'));
ensureDir(path.join(UPLOADS_ROOT, 'logos'));

// ─── File filter ──────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only image files (jpg, png, webp) are allowed'), false);
  }
};

// ─── Storage factory ──────────────────────────────────────────────────────────
// Creates a diskStorage for the given subfolder under uploads/
const makeStorage = (subfolder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(UPLOADS_ROOT, subfolder));
    },
    filename: (req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      // Random hex name to avoid collisions and hide original filenames
      const name = `${subfolder.replace(/s$/, '')}-${crypto.randomBytes(16).toString('hex')}${ext}`;
      cb(null, name);
    },
  });

// ─── Multer wrapper ───────────────────────────────────────────────────────────
// After multer saves the file, we replace the absolute filesystem path with
// a relative URL (e.g. /uploads/products/filename.jpg).
// This way controllers remain unchanged — they still read from file.path / f.path.
const wrapMulter = (multerMiddleware, subfolder) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof ApiError)      return next(err);
      if (err.code === 'LIMIT_FILE_SIZE')  return next(new ApiError(400, 'File too large (max 5 MB)'));
      if (err.code === 'LIMIT_FILE_COUNT') return next(new ApiError(400, 'Too many files (max 10)'));
      return next(new ApiError(400, err.message));
    }

    const base = getBaseUrl();

    // Single file upload — set full URL so DB stores a ready-to-use link
    if (req.file) {
      req.file.path = `${base}/uploads/${subfolder}/${req.file.filename}`;
    }

    // Multiple files upload
    if (req.files && Array.isArray(req.files)) {
      req.files = req.files.map((f) => ({
        ...f,
        path: `${base}/uploads/${subfolder}/${f.filename}`,
      }));
    }

    next();
  });
};

// ─── Exported middleware ──────────────────────────────────────────────────────

// Product images — up to 10, field name: "images", max 5 MB each
const uploadProductImages = wrapMulter(
  multer({
    storage:    makeStorage('products'),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  }).array('images', 10),
  'products'
);

// Store logo — single file, field name: "logo", max 2 MB
const uploadLogo = wrapMulter(
  multer({
    storage:    makeStorage('logos'),
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
  }).single('logo'),
  'logos'
);

module.exports = { uploadProductImages, uploadLogo };
