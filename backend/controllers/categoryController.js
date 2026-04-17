const pool = require('../config/db');

const getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json({ status: 'success', data: result.rows });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const createCategory = async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ status: 'error', message: 'Nama kategori tidak boleh kosong' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ status: 'error', message: 'Kategori sudah ada' });
    }
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ status: 'error', message: 'Nama kategori tidak boleh kosong' });
  }
  try {
    const result = await pool.query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
      [name.trim(), id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Kategori tidak ditemukan' });
    }
    res.json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ status: 'error', message: 'Nama kategori sudah digunakan' });
    }
    res.status(500).json({ status: 'error', message: err.message });
  }
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    // Set products dengan kategori ini menjadi null (jangan hard-delete)
    await pool.query('UPDATE products SET category_id = NULL WHERE category_id = $1', [id]);
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'Kategori tidak ditemukan' });
    }
    res.json({ status: 'success', message: 'Kategori berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
