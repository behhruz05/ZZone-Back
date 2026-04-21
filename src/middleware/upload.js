const multer = require('multer');
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');

const ApiError = require('../utils/ApiError');

// ─── Upload root ───────────────────────────────────────────────────────────────
// Local dev:  back/Backend/uploads/
// Railway:    set UPLOAD_PATH=/app/uploads  (persistent volume mount point)
const UPLOADS_ROOT = process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
ensureDir(path.join(UPLOADS_ROOT, 'products'));
ensureDir(path.join(UPLOADS_ROOT, 'logos'));

// ─── Base URL ─────────────────────────────────────────────────────────────────
// Local dev:  http://localhost:3000
// Railway:    set BASE_URL=https://zzone-back-production-b0e9.up.railway.app
const getBaseUrl = () => process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

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
const makeStorage = (subfolder) =>
  multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(UPLOADS_ROOT, subfolder)),
    filename: (req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      const name = `${subfolder.replace(/s$/, '')}-${crypto.randomBytes(16).toString('hex')}${ext}`;
      cb(null, name);
    },
  });

// ─── Multer wrapper ───────────────────────────────────────────────────────────
// Replaces filesystem path with a full public URL before reaching controllers.
const wrapMulter = (multerMiddleware, subfolder) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof ApiError)         return next(err);
      if (err.code === 'LIMIT_FILE_SIZE')  return next(new ApiError(400, 'File too large (max 5 MB)'));
      if (err.code === 'LIMIT_FILE_COUNT') return next(new ApiError(400, 'Too many files (max 10)'));
      return next(new ApiError(400, err.message));
    }

    const base = getBaseUrl();

    if (req.file) {
      req.file.path = `${base}/uploads/${subfolder}/${req.file.filename}`;
    }
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

const uploadProductImages = wrapMulter(
  multer({
    storage:    makeStorage('products'),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
  }).array('images', 10),
  'products'
);

const uploadLogo = wrapMulter(
  multer({
    storage:    makeStorage('logos'),
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 },
  }).single('logo'),
  'logos'
);

module.exports = { uploadProductImages, uploadLogo };
