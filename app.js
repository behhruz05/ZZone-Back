const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const path         = require('path');
const errorHandler = require('./src/middleware/errorHandler');

// ─── Route imports ────────────────────────────────────────────────────────────
const authRoutes    = require('./src/routes/auth.routes');
const storeRoutes   = require('./src/routes/store.routes');
const productRoutes = require('./src/routes/product.routes');
const adminRoutes   = require('./src/routes/admin.routes');

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static file serving (uploaded images) ────────────────────────────────────
// Images are accessible at: GET /uploads/products/<filename>
//                           GET /uploads/logos/<filename>
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/stores',   storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin',    adminRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

module.exports = app;
