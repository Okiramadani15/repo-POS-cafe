const express = require('express');
const router = express.Router();
const { getAllProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Endpoint publik/kasir
router.get('/', getAllProducts);

// Endpoint Admin & Owner
router.post('/', verifyToken, authorizeRole(['admin', 'owner']), createProduct);
router.put('/:id', verifyToken, authorizeRole(['admin', 'owner']), updateProduct);
router.delete('/:id', verifyToken, authorizeRole(['admin', 'owner']), deleteProduct);

module.exports = router;