const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const { getSettings, updateSettings, uploadLogo, resetLogo } = require('../controllers/settingsController');

// ─── Multer khusus logo ───────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = file.fieldname === 'login_logo' ? 'login_logo' : 'app_logo';
    cb(null, `${name}_${Date.now()}${ext}`);
  },
});

const logoUpload = multer({
  storage: logoStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Format tidak didukung. Gunakan JPG, PNG, WebP, atau SVG.'));
  },
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB untuk logo
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET settings — public (dipakai di login & sidebar)
router.get('/', getSettings);

// PUT update text settings
router.put('/', verifyToken, authorizeRole(['admin', 'owner']), updateSettings);

// POST upload logo — fields: 'logo' atau 'login_logo'
router.post(
  '/logo',
  verifyToken,
  authorizeRole(['admin', 'owner']),
  logoUpload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'login_logo', maxCount: 1 },
  ]),
  uploadLogo
);

// DELETE reset logo ke default
router.delete('/logo/:type', verifyToken, authorizeRole(['admin', 'owner']), resetLogo);

module.exports = router;
