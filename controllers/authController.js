const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Fungsi untuk Daftar User Baru (Hanya bisa dipanggil oleh Admin)
const register = async (req, res) => {
    const { username, password, role } = req.body;
    
    // Validasi agar role yang dimasukkan hanya yang diizinkan
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
            message: `User ${username} dengan role ${selectedRole} berhasil dibuat`,
            data: newUser.rows[0] 
        });
    } catch (error) {
        // Cek jika username sudah ada (Unique Constraint)
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
        const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ status: 'error', message: 'User tidak ditemukan' });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Password salah' });
        }

        // Buat Token dengan payload ID dan ROLE
        const token = jwt.sign(
            { 
                id: user.id, 
                role: user.role // Info ini akan dibaca oleh authorizeRole
            },
            'rahasia_mill_2',
            { expiresIn: '1d' }
        );

        res.json({ 
            status: 'success', 
            message: 'Login berhasil',
            role: user.role, // Kirim role ke frontend juga agar UI bisa menyesuaikan
            token 
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = { register, login };