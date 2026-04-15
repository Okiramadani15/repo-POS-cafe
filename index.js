const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json'); // Ambil file JSON tadi
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
app.use(express.json());

// Langsung gunakan swaggerDocument tanpa swagger-jsdoc
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api', productRoutes);
app.use('/api', orderRoutes);

app.get('/ping', (req, res) => res.send('Server Berhasil Hidup!'));

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📖 Swagger: http://localhost:8080/api-docs`);
});