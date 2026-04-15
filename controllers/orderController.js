const pool = require('../config/db');

const createOrder = async (req, res) => {
  const { items, user_id, table_no } = req.body;
  
  // Kita gunakan client dari pool agar bisa menjalankan transaksi (Transaction)
  const client = await pool.connect();

  try {
    // 1. Memulai Transaksi
    await client.query('BEGIN');

    let totalAmount = 0;
    const orderItemsData = [];

    // 2. Loop Validasi Produk, Stok, dan Hitung Total
    for (const item of items) {
      // Ambil produk dan kunci baris (FOR UPDATE) agar tidak ada transaksi bentrok
      const productResult = await client.query(
        'SELECT * FROM products WHERE id = $1 FOR UPDATE', 
        [item.product_id]
      );
      
      const product = productResult.rows[0];

      if (!product) {
        throw new Error(`Produk dengan ID ${item.product_id} tidak ditemukan`);
      }

      // Cek apakah stok cukup
      if (parseInt(product.stock) < parseInt(item.quantity)) {
        throw new Error(`Stok untuk ${product.name} tidak mencukupi (Tersisa: ${product.stock})`);
      }

      const price = parseFloat(product.price);
      totalAmount += price * item.quantity;

      // Masukkan ke array penampung sementara
      orderItemsData.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: price
      });

      // 3. Update/Kurangi Stok di tabel products
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // 4. Buat Order Number otomatis
    const order_no = 'ORD-' + Date.now();

    // 5. Simpan ke tabel orders
    const newOrder = await client.query(
      `INSERT INTO orders (order_no, user_id, table_no, total_amount, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [order_no, user_id || null, table_no || 0, totalAmount, 'pending']
    );

    const orderId = newOrder.rows[0].id;

    // 6. Simpan ke tabel order_items (Pastikan menggunakan kolom price_at_time sesuai DBeaver)
    for (const detail of orderItemsData) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES ($1, $2, $3, $4)',
        [orderId, detail.product_id, detail.quantity, detail.price]
      );
    }

    // 7. Jika semua sukses, Commit transaksi
    await client.query('COMMIT');

    res.status(201).json({
      status: 'success',
      message: 'Order berhasil dibuat dan stok telah diperbarui!',
      data: newOrder.rows[0]
    });

  } catch (error) {
    // 8. Jika ada error di tengah jalan, batalkan semua (Rollback)
    await client.query('ROLLBACK');
    console.error("Error Transaction:", error.message);
    res.status(500).json({ status: 'error', message: error.message });
  } finally {
    // 9. Lepaskan client kembali ke pool
    client.release();
  }
};

module.exports = { createOrder };