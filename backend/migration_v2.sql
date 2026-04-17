-- ============================================================
--  Migration v2 — Payment fields, indexes, schema fixes
--  Jalankan sekali di psql: \i migration_v2.sql
-- ============================================================

-- 1. Kolom payment di tabel orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_amount  NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS change_amount   NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes           TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount        NUMERIC(10,2) DEFAULT 0;

-- 2. Fix inkonsistensi status: 'completed' → 'success'
UPDATE orders SET status = 'success' WHERE status = 'completed';

-- 3. Kolom is_active di users (untuk disable akun tanpa hapus)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4. Indexes untuk query yang sering dipakai
CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id     ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order  ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category_id);

-- 5. Pastikan tables.capacity tidak null (default 4)
ALTER TABLE tables ALTER COLUMN capacity SET DEFAULT 4;
UPDATE tables SET capacity = 4 WHERE capacity IS NULL;

-- Selesai
SELECT 'Migration v2 berhasil dijalankan.' AS info;
