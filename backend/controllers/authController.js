const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ─── In-Memory Rate Limiter (per username) ────────────────────────────────────
// Melengkapi rate limiter IP di authRoutes — ini mengunci per username
// sehingga satu akun tidak bisa diserang dari banyak IP berbeda.
// Catatan: untuk production multi-instance, ganti dengan Redis.
const loginAttempts = new Map();

const RATE_LIMIT = {
  MAX_ATTEMPTS: 5,             // Maks gagal sebelum username dikunci
  WINDOW_MS: 15 * 60 * 1000,  // Window 15 menit
  LOCKOUT_MS: 15 * 60 * 1000, // Durasi lockout 15 menit
};

function checkRateLimit(identifier) {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record) return { blocked: false, remainingSeconds: 0 };

  if (now - record.firstAttempt > RATE_LIMIT.WINDOW_MS) {
    loginAttempts.delete(identifier);
    return { blocked: false, remainingSeconds: 0 };
  }

  if (record.attempts >= RATE_LIMIT.MAX_ATTEMPTS) {
    const lockedUntil = record.lockedAt + RATE_LIMIT.LOCKOUT_MS;
    if (now < lockedUntil) {
      return { blocked: true, remainingSeconds: Math.ceil((lockedUntil - now) / 1000) };
    }
    loginAttempts.delete(identifier);
    return { blocked: false, remainingSeconds: 0 };
  }

  return { blocked: false, remainingSeconds: 0, attempts: record.attempts };
}

function recordFailedAttempt(identifier) {
  const now = Date.now();
  const record = loginAttempts.get(identifier) || { attempts: 0, firstAttempt: now, lockedAt: null };
  record.attempts += 1;
  if (record.attempts === 1) record.firstAttempt = now;
  if (record.attempts >= RATE_LIMIT.MAX_ATTEMPTS) record.lockedAt = now;
  loginAttempts.set(identifier, record);
  return record.attempts;
}

function resetAttempts(identifier) {
  loginAttempts.delete(identifier);
}

// ─── Validasi Input ────────────────────────────────────────────────────────────
function validateLoginInput(username, password) {
  const errors = [];

  if (!username || typeof username !== 'string' || username.trim() === '') {
    errors.push({ field: 'username', message: 'Username tidak boleh kosong' });
  } else if (username.trim().length < 3) {
    errors.push({ field: 'username', message: 'Username minimal 3 karakter' });
  } else if (username.trim().length > 50) {
    errors.push({ field: 'username', message: 'Username maksimal 50 karakter' });
  }

  if (!password || typeof password !== 'string' || password === '') {
    errors.push({ field: 'password', message: 'Password tidak boleh kosong' });
  } else if (password.length < 4) {
    errors.push({ field: 'password', message: 'Password minimal 4 karakter' });
  }

  return errors;
}

function validateRegisterInput(username, password, role) {
  const errors = [];

  if (!username || typeof username !== 'string' || username.trim() === '') {
    errors.push({ field: 'username', message: 'Username tidak boleh kosong' });
  } else if (username.trim().length < 3) {
    errors.push({ field: 'username', message: 'Username minimal 3 karakter' });
  } else if (username.trim().length > 50) {
    errors.push({ field: 'username', message: 'Username maksimal 50 karakter' });
  } else if (!/^[a-zA-Z0-9._-]+$/.test(username.trim())) {
    errors.push({ field: 'username', message: 'Username hanya boleh mengandung huruf, angka, titik, underscore, atau strip' });
  }

  if (!password || typeof password !== 'string' || password === '') {
    errors.push({ field: 'password', message: 'Password tidak boleh kosong' });
  } else if (password.length < 6) {
    errors.push({ field: 'password', message: 'Password minimal 6 karakter' });
  }

  const validRoles = ['admin', 'kasir', 'owner'];
  if (role && !validRoles.includes(role.toLowerCase())) {
    errors.push({ field: 'role', message: 'Role tidak valid. Pilih: admin, kasir, atau owner' });
  }

  return errors;
}

// ─── Register ──────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const { username, password, role } = req.body;

  const validationErrors = validateRegisterInput(username, password, role);
  if (validationErrors.length > 0) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: validationErrors[0].message,
      errors: validationErrors,
    });
  }

  const selectedRole = role ? role.toLowerCase() : 'kasir';
  const trimmedUsername = username.trim();

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [trimmedUsername, hashedPassword, selectedRole]
    );

    console.info(`[Register] User baru dibuat: '${trimmedUsername}' (${selectedRole}) oleh ${req.user?.username ?? 'unknown'}`);

    return res.status(201).json({
      status: 'success',
      code: 'REGISTER_SUCCESS',
      message: `User '${trimmedUsername}' berhasil dibuat`,
      data: {
        id: newUser.rows[0].id,
        username: newUser.rows[0].username,
        role: newUser.rows[0].role,
      },
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        status: 'error',
        code: 'USERNAME_TAKEN',
        message: `Username '${trimmedUsername}' sudah terdaftar. Gunakan username lain.`,
      });
    }

    console.error('[Register Error]', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Terjadi kesalahan pada server. Silakan coba lagi.',
    });
  }
};

// ─── Login ─────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { username, password } = req.body;

  // 1. Validasi input
  const validationErrors = validateLoginInput(username, password);
  if (validationErrors.length > 0) {
    return res.status(400).json({
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: validationErrors[0].message,
      errors: validationErrors,
    });
  }

  const trimmedUsername = username.trim();

  // 2. Cek rate limit per username (rate limit per IP sudah ada di loginLimiter routes)
  const rateLimitStatus = checkRateLimit(`user:${trimmedUsername}`);
  if (rateLimitStatus.blocked) {
    console.warn(`[Login] Username '${trimmedUsername}' terkunci (rate limit)`);
    return res.status(429).json({
      status: 'error',
      code: 'RATE_LIMITED',
      message: `Akun ini dikunci sementara karena terlalu banyak percobaan. Coba lagi dalam ${rateLimitStatus.remainingSeconds} detik.`,
      retryAfter: rateLimitStatus.remainingSeconds,
    });
  }

  try {
    // 3. Cari user — kolom eksplisit, bukan SELECT *
    const userResult = await pool.query(
      'SELECT id, username, password, role, is_active FROM users WHERE username = $1',
      [trimmedUsername]
    );

    // 4. Username tidak ditemukan — pesan generik untuk keamanan
    if (userResult.rows.length === 0) {
      recordFailedAttempt(`user:${trimmedUsername}`);
      return res.status(401).json({
        status: 'error',
        code: 'INVALID_CREDENTIALS',
        message: 'Username atau password yang Anda masukkan salah.',
      });
    }

    const user = userResult.rows[0];

    // 5. Cek status aktif akun (jika kolom is_active ada di tabel)
    if (user.is_active === false) {
      console.warn(`[Login] Percobaan login ke akun nonaktif: '${trimmedUsername}'`);
      return res.status(403).json({
        status: 'error',
        code: 'ACCOUNT_DISABLED',
        message: 'Akun Anda telah dinonaktifkan. Hubungi administrator.',
      });
    }

    // 6. Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const totalAttempts = recordFailedAttempt(`user:${trimmedUsername}`);
      const remaining = RATE_LIMIT.MAX_ATTEMPTS - totalAttempts;

      console.warn(`[Login] Password salah untuk '${trimmedUsername}' — percobaan ke-${totalAttempts}`);

      if (remaining <= 0) {
        return res.status(401).json({
          status: 'error',
          code: 'INVALID_CREDENTIALS',
          message: `Password salah. Akun dikunci selama ${RATE_LIMIT.LOCKOUT_MS / 60000} menit karena terlalu banyak percobaan.`,
          remainingAttempts: 0,
        });
      }

      return res.status(401).json({
        status: 'error',
        code: 'INVALID_CREDENTIALS',
        message: `Username atau password yang Anda masukkan salah. ${remaining} percobaan tersisa.`,
        remainingAttempts: remaining,
      });
    }

    // 7. Berhasil — reset rate limit
    resetAttempts(`user:${trimmedUsername}`);

    // 8. Pastikan JWT_SECRET ada
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[Login] FATAL: JWT_SECRET tidak ditemukan di environment variables!');
      return res.status(500).json({
        status: 'error',
        code: 'SERVER_ERROR',
        message: 'Terjadi kesalahan konfigurasi server.',
      });
    }

    // 9. Buat token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    console.info(`[Login] Berhasil: '${user.username}' (${user.role})`);

    return res.status(200).json({
      status: 'success',
      code: 'LOGIN_SUCCESS',
      message: 'Login berhasil',
      token,
      role: user.role,
      username: user.username,
    });

  } catch (error) {
    console.error('[Login Error]', error);
    return res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: 'Terjadi kesalahan pada server. Silakan coba lagi.',
    });
  }
};

module.exports = { register, login };