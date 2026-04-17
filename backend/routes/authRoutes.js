const express = require('express');
const router = express.Router();
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { register, login } = require('../controllers/authController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// ─── Rate Limiter khusus endpoint /login ──────────────────────────────────────
// Membatasi 10 percobaan per IP dalam 15 menit.
// ipKeyGenerator — helper resmi express-rate-limit v8 untuk handle IPv4 & IPv6.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 menit
  max: 10,                      // maks 10 request per IP per window
  standardHeaders: 'draft-7',  // kirim header RateLimit-* (RFC draft-7)
  legacyHeaders: false,         // nonaktifkan X-RateLimit-* lama
  skipSuccessfulRequests: true, // hanya hitung request yang GAGAL (4xx/5xx)
  keyGenerator: (req) => ipKeyGenerator(req), // handle IPv4 & IPv6 dengan benar
  handler: (req, res, next, options) => {
    console.warn(`[Rate Limit] IP ${req.ip} diblokir di /login`);
    return res.status(429).json({
      status: 'error',
      code: 'RATE_LIMITED',
      message: `Terlalu banyak percobaan login dari perangkat ini. Coba lagi dalam ${Math.ceil(options.windowMs / 60000)} menit.`,
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// Login — publik, dengan rate limiter di depannya
router.post('/login', loginLimiter, login);

// Register — hanya admin/owner yang sudah login
router.post('/register', verifyToken, authorizeRole(['admin', 'owner']), register);

module.exports = router;