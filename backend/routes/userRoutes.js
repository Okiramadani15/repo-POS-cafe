const express = require('express');
const router = express.Router();
const { getAllUsers, updateUser, deleteUser } = require('../controllers/userController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

// Semua endpoint hanya untuk admin/owner
router.get('/', verifyToken, authorizeRole(['admin', 'owner']), getAllUsers);
router.put('/:id', verifyToken, authorizeRole(['admin', 'owner']), updateUser);
router.delete('/:id', verifyToken, authorizeRole(['admin', 'owner']), deleteUser);

module.exports = router;
