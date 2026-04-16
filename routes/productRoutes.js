const express = require('express');
const router = express.Router();
const { getAllProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Endpoint publik/kasir
router.get('/', getAllProducts);

// Endpoint Admin
router.post('/', verifyToken, authorizeRole(['admin']), createProduct);
router.put('/:id', verifyToken, authorizeRole(['admin']), updateProduct);
router.delete('/:id', verifyToken, authorizeRole(['admin']), deleteProduct);

module.exports = router;