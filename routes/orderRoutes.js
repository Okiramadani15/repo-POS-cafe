const express = require('express');
const router = express.Router();
const { createOrder } = require('../controllers/orderController');
const { verifyToken } = require('../middleware/authMiddleware'); // PERBAIKAN: Gunakan {}

/**
 * @swagger
 * /api/orders:
 * post:
 * summary: Buat pesanan baru (Checkout)
 * tags: [Orders]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * table_no:
 * type: integer
 * example: 5
 * items:
 * type: array
 * items:
 * type: object
 * properties:
 * product_id:
 * type: string
 * example: "f5765679-8b25-4074-8df4-d76659f72af7"
 * quantity:
 * type: integer
 * example: 2
 * responses:
 * 201:
 * description: Order Berhasil Dibuat
 */
router.post('/orders', verifyToken, createOrder);

module.exports = router;