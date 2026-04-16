const express = require('express');
const router = express.Router();
const { getCashierPerformance } = require('../controllers/dashboardController');
// Perhatikan tanda kurung kurawal di bawah ini:
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Dashboard hanya boleh diakses oleh Admin dan Owner
router.get('/cashier-stats', verifyToken, authorizeRole(['admin', 'owner']), getCashierPerformance);

module.exports = router;