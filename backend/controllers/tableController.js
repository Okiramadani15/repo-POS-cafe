const pool = require('../config/db');

// GET semua meja
const getAllTables = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tables ORDER BY table_number ASC');
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// POST tambah meja baru
const createTable = async (req, res) => {
  const { table_number, capacity, pos_x, pos_y } = req.body;
  if (!table_number || !String(table_number).trim()) {
    return res.status(400).json({ status: 'error', message: 'Nomor meja tidak boleh kosong' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO tables (table_number, capacity, pos_x, pos_y) VALUES ($1, $2, $3, $4) RETURNING *',
      [String(table_number).trim(), capacity || 4, pos_x || 0, pos_y || 0]
    );
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ status: 'error', message: `Meja ${table_number} sudah ada` });
    }
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// PUT update meja (nomor, kapasitas, status, posisi)
const updateTable = async (req, res) => {
  const { id } = req.params;
  const { table_number, capacity, status, pos_x, pos_y } = req.body;
  try {
    // Buat query dinamis agar hanya update field yang dikirim
    const fields = [];
    const params = [];
    let idx = 1;

    if (table_number !== undefined) { fields.push(`table_number = $${idx++}`); params.push(String(table_number).trim()); }
    if (capacity !== undefined)     { fields.push(`capacity = $${idx++}`);     params.push(capacity); }
    if (status !== undefined)       { fields.push(`status = $${idx++}`);       params.push(status); }
    if (pos_x !== undefined)        { fields.push(`pos_x = $${idx++}`);        params.push(pos_x); }
    if (pos_y !== undefined)        { fields.push(`pos_y = $${idx++}`);        params.push(pos_y); }

    if (fields.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Tidak ada field yang diupdate' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE tables SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Meja tidak ditemukan' });
    }
    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ status: 'error', message: 'Nomor meja sudah digunakan' });
    }
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// DELETE hapus meja
const deleteTable = async (req, res) => {
  const { id } = req.params;
  try {
    // Cek apakah meja sedang occupied
    const check = await pool.query("SELECT status FROM tables WHERE id = $1", [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Meja tidak ditemukan' });
    }
    if (check.rows[0].status === 'occupied') {
      return res.status(400).json({ status: 'error', message: 'Meja sedang digunakan, tidak bisa dihapus' });
    }
    await pool.query('DELETE FROM tables WHERE id = $1', [id]);
    res.json({ status: 'success', message: 'Meja berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = { getAllTables, createTable, updateTable, deleteTable };
