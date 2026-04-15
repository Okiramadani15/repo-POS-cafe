const pool = require('../config/db');

const getAllProducts = async (req, res) => {
  const { category } = req.query; 
  try {
    // Kita gabungkan (JOIN) tabel products dengan categories
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    let values = [];

    if (category) {
      query += ' WHERE c.name ILIKE $1'; // ILIKE agar tidak sensitif huruf besar/kecil
      values.push(category);
    }

    const result = await pool.query(query, values);
    res.status(200).json({
      status: 'success',
      count: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = { getAllProducts };