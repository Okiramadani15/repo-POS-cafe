const pool = require('../config/db');
const fs   = require('fs');
const path = require('path');

// Ubah rows [{key, value}] menjadi object {store_name: 'X', ...}
const rowsToObject = (rows) =>
  rows.reduce((acc, row) => { acc[row.key] = row.value; return acc; }, {});

// ─── GET semua settings (public) ─────────────────────────────────────────────
const getSettings = async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM app_settings');
    res.json({ status: 'success', data: rowsToObject(result.rows) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── UPDATE text settings (admin/owner) ──────────────────────────────────────
const updateSettings = async (req, res) => {
  const allowed = ['store_name', 'tagline', 'phone', 'address', 'primary_color'];
  const entries = Object.entries(req.body).filter(([k]) => allowed.includes(k));

  if (entries.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Tidak ada field yang valid' });
  }

  try {
    for (const [key, value] of entries) {
      await pool.query(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, value ?? '']
      );
    }
    const result = await pool.query('SELECT key, value FROM app_settings');
    res.json({ status: 'success', message: 'Pengaturan disimpan', data: rowsToObject(result.rows) });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── UPLOAD logo (admin/owner) ────────────────────────────────────────────────
// field: 'logo'  → key: 'logo_url'
// field: 'login_logo' → key: 'login_logo_url'
const uploadLogo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'File tidak ditemukan' });
  }

  const fieldName = req.file.fieldname; // 'logo' atau 'login_logo'
  const settingKey = fieldName === 'login_logo' ? 'login_logo_url' : 'logo_url';
  const newUrl = `/uploads/${req.file.filename}`;

  try {
    // Hapus file lama jika ada
    const old = await pool.query('SELECT value FROM app_settings WHERE key = $1', [settingKey]);
    if (old.rows.length > 0 && old.rows[0].value) {
      const oldPath = path.join(__dirname, '../uploads', path.basename(old.rows[0].value));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await pool.query(
      `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [settingKey, newUrl]
    );

    res.json({ status: 'success', message: 'Logo berhasil diunggah', data: { [settingKey]: newUrl } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── RESET logo ke default ────────────────────────────────────────────────────
const resetLogo = async (req, res) => {
  const { type } = req.params; // 'logo' atau 'login_logo'
  const settingKey = type === 'login_logo' ? 'login_logo_url' : 'logo_url';

  try {
    const old = await pool.query('SELECT value FROM app_settings WHERE key = $1', [settingKey]);
    if (old.rows.length > 0 && old.rows[0].value) {
      const oldPath = path.join(__dirname, '../uploads', path.basename(old.rows[0].value));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await pool.query(
      `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, NULL, NOW())
       ON CONFLICT (key) DO UPDATE SET value = NULL, updated_at = NOW()`,
      [settingKey]
    );

    res.json({ status: 'success', message: 'Logo direset ke default' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = { getSettings, updateSettings, uploadLogo, resetLogo };
