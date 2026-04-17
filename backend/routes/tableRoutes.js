const express = require('express');
const router = express.Router();
const { getAllTables, createTable, updateTable, deleteTable } = require('../controllers/tableController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');

router.get('/',     verifyToken, getAllTables);
router.post('/',    verifyToken, authorizeRole(['admin', 'owner']), createTable);
router.put('/:id',  verifyToken, updateTable);
router.delete('/:id', verifyToken, authorizeRole(['admin', 'owner']), deleteTable);

module.exports = router;
