const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Fungsi untuk Daftar User Baru
const register = async (req, res) => {
    const { username, password, role } = req.body;
    
    const validRoles = ['admin', 'kasir', 'owner'];
    const selectedRole = role ? role.toLowerCase() : 'kasir';

    if (role && !validRoles.includes(selectedRole)) {
        return res.status(400).json({ 
            status: 'error', 
            message: 'Role tidak valid. Pilih antara: admin, kasir, atau owner' 
        });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            [username, hashedPassword, selectedRole]
        );
        res.status(201).json({ 
            status: 'success', 
            message: `User ${username} berhasil dibuat`,
            token: null, // Konsistensi payload
            role: newUser.rows[0].role
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ status: 'error', message: 'Username sudah terdaftar' });
        }
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// Fungsi Login
const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        // 1. Cari user
        const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'Username tidak terdaftar' 
            });
        }

        const user = userResult.rows[0];

        // 2. Cek Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'Password yang Anda masukkan salah' 
            });
        }

        // 3. Buat Token (Pastikan secret ini sama dengan yang ada di middleware auth)
        const token = jwt.sign(
            { id: user.id, role: user.role },
            'rahasia_super_secret',
            { expiresIn: '24h' }
        );

        // 4. Kirim Response (Disesuaikan agar mudah dibaca Axios)
        res.status(200).json({ 
            status: 'success', 
            token: token, 
            role: user.role,
            username: user.username 
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Terjadi kesalahan pada server' 
        });
    }
};

module.exports = { register, login };