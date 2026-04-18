const pool = require('../config/db');

const createOrder = async (req, res) => {
  const {
    items,
    table_id,
    payment_method = 'cash',   // cash | qris | transfer | dana | ovo | gopay
    payment_amount,            // jumlah uang diterima (untuk cash)
    notes,                     // catatan pesanan
    discount = 0,              // diskon dalam rupiah
  } = req.body;

  const user_id = req.user ? req.user.id : null;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Pesanan tidak boleh kosong');
    }

    const validMethods = ['cash', 'qris', 'transfer', 'dana', 'ovo', 'gopay'];
    if (!validMethods.includes(payment_method)) {
      throw new Error(`Metode pembayaran tidak valid. Pilih: ${validMethods.join(', ')}`);
    }

    // --- 1. CEK & UPDATE STATUS MEJA ---
    if (table_id) {
      const tableCheck = await client.query('SELECT status FROM tables WHERE id = $1', [table_id]);
      if (tableCheck.rows.length === 0) throw new Error('Meja tidak ditemukan');
      await client.query("UPDATE tables SET status = 'occupied' WHERE id = $1", [table_id]);
    }

    // --- 2. VALIDASI PRODUK & STOK ---
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const productResult = await client.query(
        'SELECT id, name, price, stock FROM products WHERE id = $1 FOR UPDATE',
        [item.product_id]
      );
      const product = productResult.rows[0];
      if (!product) throw new Error(`Produk ID ${item.product_id} tidak ditemukan`);
      if (parseInt(product.stock) < parseInt(item.quantity)) {
        throw new Error(`Stok "${product.name}" tidak cukup (sisa: ${product.stock})`);
      }

      const price = parseFloat(product.price);
      totalAmount += price * item.quantity;
      orderItemsData.push({ product_id: item.product_id, quantity: item.quantity, price });

      // --- 3. POTONG STOK ---
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.product_id]);
    }

    // --- 4. HITUNG DISKON & KEMBALIAN ---
    const discountAmt    = Math.min(parseFloat(discount) || 0, totalAmount);
    const grandTotal     = totalAmount - discountAmt;
    const paidAmount     = payment_method === 'cash' ? (parseFloat(payment_amount) || grandTotal) : grandTotal;
    const changeAmount   = payment_method === 'cash' ? Math.max(paidAmount - grandTotal, 0) : 0;

    if (payment_method === 'cash' && paidAmount < grandTotal) {
      throw new Error(`Uang kurang. Total: ${grandTotal}, dibayar: ${paidAmount}`);
    }

    // --- 5. SIMPAN HEADER ORDER ---
    const order_no = 'ORD-' + Date.now();
    const newOrder = await client.query(
      `INSERT INTO orders
         (order_no, user_id, table_id, total_amount, discount, status,
          payment_method, payment_amount, change_amount, notes, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()) RETURNING *`,
      [order_no, user_id, table_id || null, grandTotal, discountAmt, 'success',
       payment_method, paidAmount, changeAmount, notes || null]
    );

    const orderId = newOrder.rows[0].id;

    // --- 6. SIMPAN ITEM ORDER ---
    for (const detail of orderItemsData) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES ($1,$2,$3,$4)',
        [orderId, detail.product_id, detail.quantity, detail.price]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({
      status: 'success',
      message: 'Transaksi berhasil',
      data: {
        ...newOrder.rows[0],
        kembalian: changeAmount,
      },
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Order Error:', error.message);
    res.status(400).json({ status: 'error', message: error.message });
  } finally {
    client.release();
  }
};

// ─── GET semua orders (admin/owner) ──────────────────────────────────────────
const getAllOrders = async (req, res) => {
  try {
    const { search, date_from, date_to, status } = req.query;

    let conditions = [];
    let params = [];
    let idx = 1;

    if (search) {
      conditions.push(`(o.order_no ILIKE $${idx} OR u.username ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (date_from) {
      conditions.push(`o.created_at >= $${idx}::date`);
      params.push(date_from);
      idx++;
    }
    if (date_to) {
      conditions.push(`o.created_at < ($${idx}::date + INTERVAL '1 day')`);
      params.push(date_to);
      idx++;
    }
    if (status) {
      conditions.push(`o.status = $${idx}`);
      params.push(status);
      idx++;
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const result = await pool.query(`
      SELECT o.id, o.order_no, o.total_amount, o.status, o.created_at,
             o.payment_method, o.payment_amount, o.change_amount, o.notes,
             u.username AS kasir,
             t.table_number AS meja
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN tables t ON o.table_id = t.id
      ${where}
      ORDER BY o.created_at DESC
      LIMIT 200
    `, params);

    res.status(200).json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('[getAllOrders]', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── GET detail satu order (items) ───────────────────────────────────────────
const getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const orderRes = await pool.query(`
      SELECT o.id, o.order_no, o.total_amount, o.status, o.created_at,
             o.payment_method, o.payment_amount, o.change_amount, o.notes,
             u.username AS kasir,
             t.table_number AS meja
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN tables t ON o.table_id = t.id
      WHERE o.id = $1
    `, [id]);

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order tidak ditemukan' });
    }

    const itemsRes = await pool.query(`
      SELECT oi.quantity, oi.price_at_time, p.name AS product_name, p.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [id]);

    res.status(200).json({
      status: 'success',
      data: { ...orderRes.rows[0], items: itemsRes.rows },
    });
  } catch (err) {
    console.error('[getOrderDetail]', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── DELETE order ─────────────────────────────────────────────────────────────
const deleteOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);
    const del = await client.query('DELETE FROM orders WHERE id = $1 RETURNING id', [id]);
    if (del.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'Order tidak ditemukan' });
    }
    await client.query('COMMIT');
    res.status(200).json({ status: 'success', message: 'Order berhasil dihapus' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[deleteOrder]', err);
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    client.release();
  }
};

module.exports = { createOrder, getAllOrders, getOrderDetail, deleteOrder };