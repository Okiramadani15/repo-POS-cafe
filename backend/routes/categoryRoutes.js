const express = require('express');
const router = express.Router();
const { getCategories, createCategory } = require('../controllers/categoryController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

router.get('/', getCategories);
router.post('/', verifyToken, authorizeRole(['admin', 'owner']), createCategory);

module.exports = router;