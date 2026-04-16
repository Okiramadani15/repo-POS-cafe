const pool = require('../config/db');

// Ambil semua daftar meja
const getAllTables = async (req, res) => {
    try {
        // Mengurutkan berdasarkan nomor meja agar rapi di Frontend
        const result = await pool.query('SELECT * FROM tables ORDER BY table_number ASC');
        res.status(200).json({
            status: 'success',
            data: result.rows
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// Tambah meja baru
const createTable = async (req, res) => {
    const { table_number, capacity, pos_x, pos_y } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO tables (table_number, capacity, pos_x, pos_y) VALUES ($1, $2, $3, $4) RETURNING *',
            [table_number, capacity, pos_x || 0, pos_y || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update status atau posisi meja (Untuk Drag & Drop Frontend nanti)
const updateTable = async (req, res) => {
    const { id } = req.params;
    const { status, pos_x, pos_y } = req.body;
    try {
        const result = await pool.query(
            'UPDATE tables SET status = $1, pos_x = $2, pos_y = $3 WHERE id = $4 RETURNING *',
            [status, pos_x, pos_y, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



module.exports = { getAllTables, createTable, updateTable };