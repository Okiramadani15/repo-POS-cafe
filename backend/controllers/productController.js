const pool = require('../config/db');

// GET ALL PRODUCTS
const getAllProducts = async (req, res) => {
  const { category } = req.query; 
  try {
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    let values = [];

    if (category) {
      query += ' WHERE c.name ILIKE $1';
      values.push(category);
    }

    const result = await pool.query(query, values);
    res.status(200).json({ status: 'success', count: result.rowCount, data: result.rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// CREATE PRODUCT
const createProduct = async (req, res) => {
  const { name, price, cost_price, stock, category_id, sku } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || null);
  // Konversi category_id ke integer atau null agar tidak error di FK kolom
  const cat_id = category_id && category_id !== '' ? category_id : null;
  try {
    const result = await pool.query(
      `INSERT INTO products (name, price, cost_price, stock, category_id, sku, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, price, cost_price || 0, stock || 0, cat_id, sku, image_url]
    );
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// UPDATE PRODUCT
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, cost_price, stock, category_id, sku } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || null);
  const cat_id = category_id && category_id !== '' ? category_id : null;
  try {
    const result = await pool.query(
      `UPDATE products
       SET name = $1, price = $2, cost_price = $3, stock = $4, category_id = $5, sku = $6, image_url = $7
       WHERE id = $8 RETURNING *`,
      [name, price, cost_price, stock, cat_id, sku, image_url, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });
    
    res.status(200).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// DELETE PRODUCT
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Produk tidak ditemukan' });

    res.status(200).json({ status: 'success', message: 'Produk berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = { getAllProducts, createProduct, updateProduct, deleteProduct };