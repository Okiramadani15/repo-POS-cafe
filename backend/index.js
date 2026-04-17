const app = require('./app');

const PORT = 8080;

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📖 Swagger: http://localhost:8080/api-docs`);
});