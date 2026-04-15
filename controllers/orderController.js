const pool = require('../config/db');

const createOrder = async (req, res) => {
  const { items, table_no } = req.body;
  
  // Ambil user_id dari token (asumsi verifyToken sudah jalan)
  const user_id = req.user ? req.user.id : null;
  
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let totalAmount = 0;
    const orderItemsData = [];

    // 1. Validasi Produk & Stok
    for (const item of items) {
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

      // 2. Potong Stok
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // 3. Simpan Header Order
    const order_no = 'ORD-' + Date.now();
    const newOrder = await client.query(
      `INSERT INTO orders (order_no, user_id, table_no, total_amount, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [order_no, user_id, table_no || 0, totalAmount, 'success']
    );

    const orderId = newOrder.rows[0].id;

    // 4. Simpan Detail Order (Sesuai kolom database kamu: price_at_time)
    for (const detail of orderItemsData) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES ($1, $2, $3, $4)',
        [orderId, detail.product_id, detail.quantity, detail.price]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ status: 'success', data: newOrder.rows[0] });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Order Error:", error.message);
    res.status(500).json({ status: 'error', message: error.message });
  } finally {
    client.release();
  }
};

module.exports = { createOrder };