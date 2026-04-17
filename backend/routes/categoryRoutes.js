const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

router.get('/', getCategories);
router.post('/', verifyToken, authorizeRole(['admin', 'owner']), createCategory);
router.put('/:id', verifyToken, authorizeRole(['admin', 'owner']), updateCategory);
router.delete('/:id', verifyToken, authorizeRole(['admin', 'owner']), deleteCategory);

module.exports = router;
