const express = require('express');
const router = express.Router();
const { createOrder } = require('../controllers/orderController');

/**
 * @swagger
 * /api/orders:
 * post:
 * summary: Buat pesanan baru (Checkout)
 * tags: [Orders]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
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
router.post('/orders', createOrder);

module.exports = router;