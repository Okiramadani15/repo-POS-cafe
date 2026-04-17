const express = require('express');
const router = express.Router();
const {
  getSummary,
  getRevenueChart,
  getTopProducts,
  getRecentOrders,
  getCashierPerformance,
} = require('../controllers/dashboardController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

const adminOnly = [verifyToken, authorizeRole(['admin', 'owner'])];

router.get('/summary',         ...adminOnly, getSummary);
router.get('/revenue-chart',   ...adminOnly, getRevenueChart);
router.get('/top-products',    ...adminOnly, getTopProducts);
router.get('/recent-orders',   ...adminOnly, getRecentOrders);
router.get('/cashier-stats',   ...adminOnly, getCashierPerformance);

module.exports = router;