require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const tableRoutes = require('./routes/tableRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();

// ─── Trust Proxy ──────────────────────────────────────────────────────────────
// Wajib agar express-rate-limit membaca IP asli di balik Nginx/reverse proxy.
// Ganti angka '1' sesuai jumlah layer proxy yang ada.
app.set('trust proxy', 1);

// ─── Security Headers (Helmet) ────────────────────────────────────────────────
// Otomatis set header seperti X-Content-Type-Options, X-Frame-Options, dll.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // izinkan asset dari frontend
}));

// ─── CORS Manual ──────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin'); // Penting agar cache tidak campur response antar origin

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ─── Body Parser + Request Size Limit ────────────────────────────────────────
// Batasi ukuran request body agar tidak bisa di-abuse (misal: payload besar).
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Swagger (nonaktifkan di production) ─────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('📖 Swagger aktif di /api-docs');
}

// ─── Static Files (Uploaded Images) ──────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/ping', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server berjalan',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: `Route '${req.method} ${req.originalUrl}' tidak ditemukan.`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Tangkap semua error yang di-throw atau next(err) dari route manapun.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  // Jangan bocorkan detail error di production
  const isDev = process.env.NODE_ENV !== 'production';

  res.status(err.status || 500).json({
    status: 'error',
    code: err.code || 'SERVER_ERROR',
    message: isDev ? err.message : 'Terjadi kesalahan pada server.',
    ...(isDev && { stack: err.stack }),
  });
});

module.exports = app;