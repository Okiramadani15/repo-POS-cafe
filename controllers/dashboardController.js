const pool = require('../config/db');

const getCashierPerformance = async (req, res) => {
    const { period } = req.query; // Mengambil ?period=... dari URL
    let dateFilter = '';

    // Logika Filter Waktu
    if (period === 'today') {
        dateFilter = 'AND o.created_at >= CURRENT_DATE';
    } else if (period === 'month') {
        dateFilter = "AND o.created_at >= date_trunc('month', CURRENT_DATE)";
    } else if (period === 'year') {
        dateFilter = "AND o.created_at >= date_trunc('year', CURRENT_DATE)";
    }

    try {
        const query = `
            SELECT 
                u.username, 
                COUNT(o.id) as total_transaksi,
                COALESCE(SUM(o.total_amount), 0) as total_pendapatan
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id ${dateFilter}
            GROUP BY u.id, u.username
            ORDER BY total_pendapatan DESC;
        `;
        
        const result = await pool.query(query);
        res.status(200).json({
            status: 'success',
            period: period || 'all-time',
            data: result.rows
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

module.exports = { getCashierPerformance };