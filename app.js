const express         = require('express');
const cors            = require('cors');
const helmet          = require('helmet');
const rateLimit       = require('express-rate-limit');
const swaggerUi       = require('swagger-ui-express');
const swaggerSpec     = require('./src/config/swagger');
const errorHandler    = require('./src/middleware/errorHandler');

// ─── Route imports ────────────────────────────────────────────────────────────
const authRoutes    = require('./src/routes/auth.routes');
const storeRoutes   = require('./src/routes/store.routes');
const productRoutes = require('./src/routes/product.routes');
const adminRoutes   = require('./src/routes/admin.routes');

const app = express();

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

const authLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, message: 'Too many requests, try again in a minute' },
});

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Swagger UI ───────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'ZZone API Docs',
  swaggerOptions: { persistAuthorization: true },
}));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',     authLimiter, authRoutes);
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
