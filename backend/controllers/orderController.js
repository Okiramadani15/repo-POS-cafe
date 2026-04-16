const pool = require('../config/db');

const createOrder = async (req, res) => {
  // Ambil table_id (UUID) bukan table_no lagi agar sinkron dengan database
  const { items, table_id } = req.body;
  
  // Ambil user_id dari token (asumsi verifyToken sudah jalan)
  const user_id = req.user ? req.user.id : null;
  
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    let totalAmount = 0;
    const orderItemsData = [];

    // --- 1. INTEGRASI MEJA (Fitur Baru) ---
    // Jika ada table_id, cek dan update status meja menjadi 'occupied'
    if (table_id) {
      const tableCheck = await client.query('SELECT status FROM tables WHERE id = $1', [table_id]);
      if (tableCheck.rows.length === 0) throw new Error('Meja tidak ditemukan');
      
      // Update status meja di database
      await client.query("UPDATE tables SET status = 'occupied' WHERE id = $1", [table_id]);
    }

    // --- 2. VALIDASI PRODUK & STOK ---
    for (const item of items) {
      // FOR UPDATE mengunci row produk agar tidak ada bentrok stok di milidetik yang sama
      const productResult = await client.query(
        'SELECT * FROM products WHERE id = $1 FOR UPDATE', 
        [item.product_id]
      );
      
      const product = productResult.rows[0];
      if (!product) throw new Error(`Produk dengan ID ${item.product_id} tidak ditemukan`);

      if (parseInt(product.stock) < parseInt(item.quantity)) {
        throw new Error(`Stok ${product.name} tidak cukup (Sisa: ${product.stock})`);
      }

      const currentPrice = parseFloat(product.price);
      totalAmount += currentPrice * item.quantity;

      orderItemsData.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: currentPrice
      });

      // --- 3. POTONG STOK ---
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // --- 4. SIMPAN HEADER ORDER ---
    const order_no = 'ORD-' + Date.now();
    // Gunakan table_id (UUID) sesuai struktur tabel terbaru kamu
    const newOrder = await client.query(
      `INSERT INTO orders (order_no, user_id, table_id, total_amount, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [order_no, user_id, table_id || null, totalAmount, 'success']
    );

    const orderId = newOrder.rows[0].id;

    // --- 5. SIMPAN DETAIL ORDER ---
    // Kita gunakan batch insert (opsional) atau loop yang sudah kamu buat
    for (const detail of orderItemsData) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES ($1, $2, $3, $4)',
        [orderId, detail.product_id, detail.quantity, detail.price]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ 
      status: 'success', 
      message: 'Transaksi berhasil dan meja telah diupdate',
      data: newOrder.rows[0] 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Order Error:", error.message);
    res.status(500).json({ status: 'error', message: error.message });
  } finally {
    client.release();
  }
};

module.exports = { createOrder };