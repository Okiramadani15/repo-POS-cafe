# POS Cafe — Backend API

REST API untuk sistem Point of Sale cafe. Dibangun dengan **Node.js**, **Express.js**, dan **PostgreSQL**.

> Dokumentasi lengkap fullstack ada di [../README.md](../README.md)

---

## Jalankan Server

```bash
# Install dependencies
npm install

# Setup .env (lihat contoh di bawah)
cp .env.example .env

# Development
npx nodemon index.js

# Production
node index.js
```

Server: `http://localhost:8080`
Swagger: `http://localhost:8080/api-docs`

---

## Environment Variables (`.env`)

```env
PORT=8080
NODE_ENV=development
JWT_SECRET=ganti_dengan_secret_panjang_dan_acak
DB_HOST=localhost
DB_PORT=5432
DB_NAME=POS_cafe
DB_USER=postgres
DB_PASSWORD=password_kamu
ALLOWED_ORIGINS=http://localhost:3000
```

---

## Setup Database

```bash
# Instalasi baru — jalankan SQL schema di ../README.md
psql -U postgres -c "CREATE DATABASE \"POS_cafe\";"

# Sudah ada database versi lama — jalankan migration
psql -U postgres -d POS_cafe -f migration_v2.sql
```

Migration v2 menambahkan kolom: `payment_method`, `payment_amount`, `change_amount`, `notes`, `discount` pada tabel `orders`, serta kolom `is_active` pada tabel `users`.

---

## Struktur

```
backend/
├── index.js                  # Entry point
├── app.js                    # Express + middleware + routes
├── migration_v2.sql          # Migration kolom payment & indexes
├── config/db.js              # PostgreSQL pool
├── middleware/
│   ├── authMiddleware.js     # verifyToken, authorizeRole
│   └── uploadMiddleware.js   # multer gambar produk
├── controllers/
│   ├── authController.js     # login, register
│   ├── productController.js  # CRUD produk + upload
│   ├── categoryController.js # CRUD kategori
│   ├── tableController.js    # CRUD meja + status
│   ├── orderController.js    # checkout, list, detail, delete
│   ├── userController.js     # list, update, delete karyawan
│   └── dashboardController.js
└── routes/
    ├── authRoutes.js
    ├── productRoutes.js
    ├── categoryRoutes.js
    ├── tableRoutes.js
    ├── orderRoutes.js
    ├── userRoutes.js
    └── dashboardRoutes.js
```

---

## Endpoint Ringkas

| Method | Path | Auth | Keterangan |
|:---|:---|:---|:---|
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/register` | Admin/Owner | Buat user |
| GET/POST/PUT/DELETE | `/api/products` | Varies | CRUD produk |
| GET/POST/PUT/DELETE | `/api/categories` | Varies | CRUD kategori |
| GET/POST/PUT/DELETE | `/api/tables` | Varies | CRUD meja |
| POST/GET/DELETE | `/api/orders` | Varies | Transaksi |
| GET/PUT/DELETE | `/api/users` | Admin/Owner | Manajemen karyawan |
| GET | `/api/dashboard/*` | Admin/Owner | Statistik & laporan |

Detail lengkap ada di Swagger atau [../README.md](../README.md).

---

## Catatan Penting

- `config/db.js` masih hardcode kredensial — **pindahkan ke `process.env` sebelum deploy**
- Upload gambar disimpan di folder `uploads/` lokal — **migrasi ke Cloudinary/S3 untuk production**
- Rate limiter login: 10x per IP per 15 menit + 5x per username per 15 menit

---

**Author:** Oki Ramadani — © 2026
