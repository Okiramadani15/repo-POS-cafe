const { Pool } = require('pg');

// Konfigurasi pool sesuai database PostgreSQL kamu
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'POS_cafe',
  password: '', // Kosongkan sesuai info sebelumnya
  port: 5432,
});

pool.on('connect', () => {
  console.log('Koneksi ke Database POS_cafe Berhasil!');
});

module.exports = pool;