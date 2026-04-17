const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// ─── GET semua users ───────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('[getAllUsers]', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── UPDATE user (username, role, password opsional) ──────────────────────────
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role, password } = req.body;

    // Cek user ada
    const existing = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }

    // Cegah edit user diri sendiri jika owner (opsional safety)
    const validRoles = ['admin', 'kasir', 'owner'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ status: 'error', message: 'Role tidak valid' });
    }

    if (password) {
      // Update dengan password baru
      if (password.length < 6) {
        return res.status(400).json({ status: 'error', message: 'Password minimal 6 karakter' });
      }
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      await pool.query(
        'UPDATE users SET username = $1, role = $2, password = $3 WHERE id = $4',
        [username, role, hashed, id]
      );
    } else {
      await pool.query(
        'UPDATE users SET username = $1, role = $2 WHERE id = $3',
        [username, role, id]
      );
    }

    const updated = await pool.query(
      'SELECT id, username, role, created_at FROM users WHERE id = $1',
      [id]
    );

    res.status(200).json({
      status: 'success',
      message: 'User berhasil diupdate',
      data: updated.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ status: 'error', message: 'Username sudah digunakan' });
    }
    console.error('[updateUser]', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─── DELETE user ──────────────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Jangan hapus diri sendiri
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ status: 'error', message: 'Tidak bisa menghapus akun sendiri' });
    }

    const del = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (del.rowCount === 0) {
      return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });
    }

    res.status(200).json({ status: 'success', message: 'User berhasil dihapus' });
  } catch (err) {
    console.error('[deleteUser]', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = { getAllUsers, updateUser, deleteUser };
