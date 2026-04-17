const express = require('express');
const router = express.Router();
const { getAllProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Endpoint publik/kasir
router.get('/', getAllProducts);

// Endpoint Admin & Owner
router.post('/', verifyToken, authorizeRole(['admin', 'owner']), upload.single('image'), createProduct);
router.put('/:id', verifyToken, authorizeRole(['admin', 'owner']), upload.single('image'), updateProduct);
router.delete('/:id', verifyToken, authorizeRole(['admin', 'owner']), deleteProduct);

module.exports = router;