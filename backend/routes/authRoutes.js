const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Route Login tetap publik
router.post('/login', login);

// Route Register dikunci: Hanya Admin PT. KBM yang bisa mendaftarkan user baru
router.post('/register', verifyToken, authorizeRole(['admin']), register);

module.exports = router;