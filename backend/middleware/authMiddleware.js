const jwt = require('jsonwebtoken');

// ─── Verify Token ─────────────────────────────────────────────────────────────
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  // Token tidak dikirim sama sekali
  if (!token) {
    return res.status(401).json({
      status: 'error',
      code: 'TOKEN_MISSING',
      message: 'Akses ditolak. Token autentikasi tidak ditemukan.',
    });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('[authMiddleware] FATAL: JWT_SECRET tidak ditemukan di environment variables!');
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Terjadi kesalahan konfigurasi server.',
    });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    // Bedakan expired vs benar-benar tidak valid
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        code: 'TOKEN_EXPIRED',
        message: 'Sesi Anda telah berakhir. Silakan login kembali.',
        expiredAt: err.expiredAt,
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        code: 'TOKEN_INVALID',
        message: 'Token tidak valid. Silakan login kembali.',
      });
    }

    if (err.name === 'NotBeforeError') {
      return res.status(401).json({
        status: 'error',
        code: 'TOKEN_NOT_ACTIVE',
        message: 'Token belum aktif.',
      });
    }

    // Fallback untuk error JWT lain yang tidak terduga
    console.error('[authMiddleware] JWT Error tidak dikenal:', err);
    return res.status(401).json({
      status: 'error',
      code: 'TOKEN_INVALID',
      message: 'Token tidak dapat diverifikasi. Silakan login kembali.',
    });
  }
};

// ─── Authorize Role ───────────────────────────────────────────────────────────
const authorizeRole = (roles) => {
  return (req, res, next) => {
    // Pastikan verifyToken sudah dipanggil sebelumnya
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        status: 'error',
        code: 'TOKEN_MISSING',
        message: 'Data autentikasi tidak ditemukan.',
      });
    }

    if (!roles.includes(req.user.role)) {
      console.warn(`[authMiddleware] Akses ditolak — user '${req.user.id}' (${req.user.role}) mencoba akses route yang butuh role: [${roles.join(', ')}]`);
      return res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        message: `Akses ditolak. Role '${req.user.role}' tidak memiliki izin untuk aksi ini.`,
      });
    }

    next();
  };
};

module.exports = { verifyToken, authorizeRole };