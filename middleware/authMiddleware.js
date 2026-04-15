const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Token tidak ditemukan' });

    try {
        const verified = jwt.verify(token, 'rahasia_mill_2');
        req.user = verified; 
        next();
    } catch (err) {
        res.status(403).json({ message: 'Token tidak valid' });
    }
};

const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                status: 'error', 
                message: `Akses ditolak. Peran Anda: ${req.user.role}` 
            });
        }
        next();
    };
};

module.exports = { verifyToken, authorizeRole };