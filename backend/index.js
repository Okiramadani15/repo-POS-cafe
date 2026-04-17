require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📖 Swagger: http://localhost:${PORT}/api-docs`);
  }
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
// Pastikan semua request yang sedang berjalan selesai dulu sebelum server mati.
// Penting saat deploy ulang agar tidak ada transaksi/order yang terpotong.

function gracefulShutdown(signal) {
  console.log(`\n[${signal}] Menerima sinyal shutdown...`);

  server.close((err) => {
    if (err) {
      console.error('❌ Error saat menutup server:', err.message);
      process.exit(1);
    }
    console.log('✅ Server berhasil ditutup. Sampai jumpa!');
    process.exit(0);
  });

  // Paksa keluar jika dalam 10 detik server tidak mau tutup
  setTimeout(() => {
    console.error('⚠️  Timeout shutdown — memaksa keluar.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Docker/PM2 stop
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));  // Ctrl+C

// ─── Uncaught Exception & Rejection ──────────────────────────────────────────
// Tangkap error tak terduga agar server tidak diam-diam crash tanpa log.
process.on('uncaughtException', (err) => {
  console.error('💥 [uncaughtException]', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 [unhandledRejection]', reason);
  gracefulShutdown('unhandledRejection');
});