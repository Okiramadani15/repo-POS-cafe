-- ============================================================
--  Migration v3 — App Settings (logo, nama toko, dll)
--  Jalankan: psql -U postgres -d POS_cafe -f migration_v3.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS app_settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Isi nilai default (INSERT agar tidak overwrite jika sudah ada)
INSERT INTO app_settings (key, value) VALUES
  ('store_name',       'Point of Sale')   ON CONFLICT (key) DO NOTHING;
INSERT INTO app_settings (key, value) VALUES
  ('tagline',          'Cafe & Coffee Shop') ON CONFLICT (key) DO NOTHING;
INSERT INTO app_settings (key, value) VALUES
  ('phone',            '')               ON CONFLICT (key) DO NOTHING;
INSERT INTO app_settings (key, value) VALUES
  ('address',          '')               ON CONFLICT (key) DO NOTHING;
INSERT INTO app_settings (key, value) VALUES
  ('logo_url',         NULL)             ON CONFLICT (key) DO NOTHING;
INSERT INTO app_settings (key, value) VALUES
  ('login_logo_url',   NULL)             ON CONFLICT (key) DO NOTHING;
INSERT INTO app_settings (key, value) VALUES
  ('primary_color',    '#2563eb')        ON CONFLICT (key) DO NOTHING;

SELECT 'Migration v3 berhasil.' AS info;
