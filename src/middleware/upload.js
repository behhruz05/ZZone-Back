const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');
const supabase = require('../config/supabase');
const ApiError = require('../utils/ApiError');

const BUCKET = 'zzone';

// ─── File filter ──────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only image files (jpg, png, webp) are allowed'), false);
  }
};

// Memory storage — files stay in RAM as Buffer, then uploaded to Supabase
const memStorage = multer.memoryStorage();

// ─── Upload buffer to Supabase ────────────────────────────────────────────────
const uploadToSupabase = async (file, folder) => {
  const ext      = path.extname(file.originalname).toLowerCase();
  const filename = `${folder}/${crypto.randomBytes(16).toString('hex')}${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file.buffer, {
      contentType:  file.mimetype,
      cacheControl: '3600',
      upsert:       false,
    });

  if (error) throw new ApiError(500, `Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
};

// ─── Multer wrapper ───────────────────────────────────────────────────────────
const wrapMulter = (multerMiddleware, folder) => (req, res, next) => {
  multerMiddleware(req, res, async (err) => {
    if (err) {
      if (err instanceof ApiError)         return next(err);
      if (err.code === 'LIMIT_FILE_SIZE')  return next(new ApiError(400, 'File too large (max 5 MB)'));
      if (err.code === 'LIMIT_FILE_COUNT') return next(new ApiError(400, 'Too many files (max 10)'));
      return next(new ApiError(400, err.message));
    }

    try {
      if (req.file) {
        req.file.path = await uploadToSupabase(req.file, folder);
      }

      if (req.files && Array.isArray(req.files)) {
        const urls = await Promise.all(req.files.map((f) => uploadToSupabase(f, folder)));
        req.files = req.files.map((f, i) => ({ ...f, path: urls[i] }));
      }

      next();
    } catch (uploadErr) {
      next(uploadErr);
    }
  });
};

// ─── Exported middleware ──────────────────────────────────────────────────────

const uploadProductImages = wrapMulter(
  multer({ storage: memStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).array('images', 10),
  'products'
);

const uploadLogo = wrapMulter(
  multer({ storage: memStorage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } }).single('logo'),
  'logos'
);

module.exports = { uploadProductImages, uploadLogo };
