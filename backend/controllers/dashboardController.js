const pool = require('../config/db');

// ─── Summary Stats (cards utama dashboard) ────────────────────────────────────
const getSummary = async (req, res) => {
  try {
    const [products, orders, tables, revenue, todayOrders, todayRevenue] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM products'),
      pool.query("SELECT COUNT(*) FROM orders WHERE status = 'success'"),
      pool.query('SELECT COUNT(*) FROM tables'),
      pool.query("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'success'"),
      pool.query("SELECT COUNT(*) FROM orders WHERE status = 'success' AND created_at >= CURRENT_DATE"),
      pool.query("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'success' AND created_at >= CURRENT_DATE"),
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        total_products: parseInt(products.rows[0].count),
        total_orders: parseInt(orders.rows[0].count),
        total_tables: parseInt(tables.rows[0].count),
        total_revenue: parseFloat(revenue.rows[0].coalesce),
        today_orders: parseInt(todayOrders.rows[0].count),
        today_revenue: parseFloat(todayRevenue.rows[0].coalesce),
      },
    });
  } catch (err) {
    console.error('[getSummary]', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── Revenue 7 hari terakhir (grafik) ─────────────────────────────────────────
const getRevenueChart = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('day', created_at), 'DD Mon') AS label,
        COALESCE(SUM(total_amount), 0) AS revenue,
        COUNT(*) AS orders
      FROM orders
      WHERE status = 'success'
        AND created_at >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at) ASC
    `);

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('[getRevenueChart]', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── Produk terlaris ──────────────────────────────────────────────────────────
const getTopProducts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.name,
        p.image_url,
        SUM(oi.quantity) AS total_terjual,
        SUM(oi.quantity * oi.price_at_time) AS total_revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'success'
      GROUP BY p.id, p.name, p.image_url
      ORDER BY total_terjual DESC
      LIMIT 5
    `);

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('[getTopProducts]', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── Order terbaru ────────────────────────────────────────────────────────────
const getRecentOrders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.order_no,
        o.total_amount,
        o.status,
        o.created_at,
        u.username AS kasir,
        t.table_number AS meja
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN tables t ON o.table_id = t.id
      ORDER BY o.created_at DESC
      LIMIT 8
    `);

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('[getRecentOrders]', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── Performa kasir ───────────────────────────────────────────────────────────
const getCashierPerformance = async (req, res) => {
  const { period } = req.query;
  let dateFilter = '';

  if (period === 'today') {
    dateFilter = 'AND o.created_at >= CURRENT_DATE';
  } else if (period === 'month') {
    dateFilter = "AND o.created_at >= date_trunc('month', CURRENT_DATE)";
  } else if (period === 'year') {
    dateFilter = "AND o.created_at >= date_trunc('year', CURRENT_DATE)";
  }

  try {
    const result = await pool.query(`
      SELECT 
        u.username,
        u.role,
        COUNT(o.id) AS total_transaksi,
        COALESCE(SUM(o.total_amount), 0) AS total_pendapatan
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id ${dateFilter}
        AND o.status = 'success'
      WHERE u.role = 'kasir'
      GROUP BY u.id, u.username, u.role
      ORDER BY total_pendapatan DESC
    `);

    res.status(200).json({
      status: 'success',
      period: period || 'all-time',
      data: result.rows,
    });
  } catch (err) {
    console.error('[getCashierPerformance]', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = { getSummary, getRevenueChart, getTopProducts, getRecentOrders, getCashierPerformance };