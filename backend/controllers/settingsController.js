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
// 1 foto disimpan ke KEDUA key: logo_url & login_logo_url
const uploadLogo = async (req, res) => {
  const uploaded = req.files?.logo?.[0] || req.files?.login_logo?.[0];
  if (!uploaded) {
    return res.status(400).json({ status: 'error', message: 'File tidak ditemukan' });
  }

  const newUrl = `/uploads/${uploaded.filename}`;
  const keys   = ['logo_url', 'login_logo_url'];

  try {
    // Kumpulkan URL lama yang unik lalu hapus file fisiknya
    const oldUrls = new Set();
    for (const key of keys) {
      const row = await pool.query('SELECT value FROM app_settings WHERE key = $1', [key]);
      if (row.rows[0]?.value) oldUrls.add(row.rows[0].value);
    }
    for (const oldUrl of oldUrls) {
      const oldPath = path.join(__dirname, '../uploads', path.basename(oldUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Simpan URL baru ke kedua key
    for (const key of keys) {
      await pool.query(
        `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, newUrl]
      );
    }

    res.json({ status: 'success', message: 'Logo berhasil diunggah', data: { logo_url: newUrl, login_logo_url: newUrl } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── RESET logo ke default ────────────────────────────────────────────────────
// Reset selalu menghapus file dan mengosongkan kedua key sekaligus
const resetLogo = async (req, res) => {
  const keys = ['logo_url', 'login_logo_url'];

  try {
    const oldUrls = new Set();
    for (const key of keys) {
      const row = await pool.query('SELECT value FROM app_settings WHERE key = $1', [key]);
      if (row.rows[0]?.value) oldUrls.add(row.rows[0].value);
    }
    for (const oldUrl of oldUrls) {
      const oldPath = path.join(__dirname, '../uploads', path.basename(oldUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    for (const key of keys) {
      await pool.query(
        `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, NULL, NOW())
         ON CONFLICT (key) DO UPDATE SET value = NULL, updated_at = NOW()`,
        [key]
      );
    }

    res.json({ status: 'success', message: 'Logo direset ke default' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = { getSettings, updateSettings, uploadLogo, resetLogo };
