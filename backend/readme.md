# POS Cafe — Backend API

REST API untuk sistem Point of Sale cafe, dibangun dengan **Node.js**, **Express.js**, dan **PostgreSQL**. Mendukung autentikasi JWT, manajemen stok otomatis, transaksi atomik, dan dokumentasi Swagger interaktif.

---

## Tech Stack

| Komponen     | Library / Versi           |
| :----------- | :------------------------ |
| Runtime      | Node.js (v14+)            |
| Framework    | Express.js 4.18.2         |
| Database     | PostgreSQL + `pg` 8.20.0  |
| Auth         | jsonwebtoken 9.0.3        |
| Hash         | bcryptjs 3.0.3            |
| API Docs     | swagger-ui-express 5.0.1  |
| Dev Server   | nodemon 3.1.14            |

---

## Struktur Direktori

```
backend/
├── index.js              # Entry point — start server port 8080
├── app.js                # Express setup, middleware, route registration
├── swagger.json          # OpenAPI 3.0 spec (generated)
├── config/
│   └── db.js             # PostgreSQL connection pool
├── middleware/
│   └── authMiddleware.js # JWT verification + role-based guard
├── controllers/
│   ├── authController.js      # register, login
│   ├── productController.js   # CRUD produk + filter kategori
│   ├── categoryController.js  # CRUD kategori
│   ├── tableController.js     # CRUD meja + update status
│   ├── orderController.js     # Checkout + potong stok (transaksi atomik)
│   └── dashboardController.js # Statistik kasir & pendapatan
└── routes/
    ├── authRoutes.js
    ├── productRoutes.js
    ├── categoryRoutes.js
    ├── tableRoutes.js
    ├── orderRoutes.js
    └── dashboardRoutes.js
```

---

## Instalasi & Setup

### 1. Clone & Install

```bash
cd Pos-cafe/backend
npm install
```

### 2. Konfigurasi Environment

Buat file `.env` di root folder `backend/`:

```env
# Database
DB_USER=postgres
DB_HOST=localhost
DB_NAME=POS_cafe
DB_PASSWORD=your_password
DB_PORT=5432

# JWT
JWT_SECRET=ganti_dengan_secret_yang_kuat_dan_acak
```

> **Penting:** Perbarui `config/db.js` dan `authMiddleware.js` agar membaca dari `process.env` supaya kredensial tidak hardcode di kode.

### 3. Setup Database

Buat database di PostgreSQL lalu jalankan SQL berikut:

```sql
CREATE DATABASE "POS_cafe";

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(10) CHECK (role IN ('admin', 'kasir', 'owner')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (id SERIAL PRIMARY KEY, name VARCHAR(50) NOT NULL);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    cost_price NUMERIC(10,2),
    stock INTEGER DEFAULT 0,
    category_id INTEGER REFERENCES categories(id),
    sku VARCHAR(50),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tables (
    id SERIAL PRIMARY KEY,
    table_number VARCHAR(10) NOT NULL,
    capacity INTEGER,
    status VARCHAR(20) DEFAULT 'available',
    pos_x INTEGER,
    pos_y INTEGER
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_no VARCHAR(30) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    table_id INTEGER REFERENCES tables(id),
    total_amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price_at_time NUMERIC(10,2) NOT NULL
);
```

### 4. Jalankan Server

```bash
# Development (auto-restart on file change)
npx nodemon index.js

# Production
node index.js
```

Server berjalan di: `http://localhost:8080`

---

## Dokumentasi API

Swagger UI tersedia setelah server jalan:

```
http://localhost:8080/api-docs
```

Gunakan tombol **Authorize** di Swagger, masukkan token dari endpoint `/api/auth/login` dengan format:

```
Bearer <token_anda>
```

---

## Endpoint

### Auth

| Method | Endpoint             | Role          | Deskripsi                          |
| :----- | :------------------- | :------------ | :--------------------------------- |
| POST   | `/api/auth/login`    | Public        | Login, kembalikan JWT token        |
| POST   | `/api/auth/register` | Admin, Owner  | Buat akun user baru dengan role    |

**Body login:**
```json
{ "username": "admin", "password": "password123" }
```

**Response login:**
```json
{
  "status": "success",
  "token": "eyJ...",
  "role": "admin",
  "username": "admin"
}
```

---

### Produk

| Method | Endpoint              | Role          | Deskripsi                             |
| :----- | :-------------------- | :------------ | :------------------------------------ |
| GET    | `/api/products`       | Semua         | Daftar produk, bisa filter `?category_id=` |
| POST   | `/api/products`       | Admin, Owner  | Tambah produk baru                    |
| PUT    | `/api/products/:id`   | Admin, Owner  | Update data produk                    |
| DELETE | `/api/products/:id`   | Admin, Owner  | Hapus produk                          |

---

### Kategori

| Method | Endpoint                | Role          | Deskripsi             |
| :----- | :---------------------- | :------------ | :-------------------- |
| GET    | `/api/categories`       | Semua         | Daftar semua kategori |
| POST   | `/api/categories`       | Admin, Owner  | Tambah kategori       |
| PUT    | `/api/categories/:id`   | Admin, Owner  | Update kategori       |
| DELETE | `/api/categories/:id`   | Admin, Owner  | Hapus kategori        |

---

### Meja

| Method | Endpoint             | Role          | Deskripsi                       |
| :----- | :------------------- | :------------ | :------------------------------ |
| GET    | `/api/tables`        | Semua         | Daftar meja + status            |
| POST   | `/api/tables`        | Admin, Owner  | Tambah meja                     |
| PUT    | `/api/tables/:id`    | Semua (login) | Update status/data meja         |
| DELETE | `/api/tables/:id`    | Admin, Owner  | Hapus meja                      |

---

### Order (Checkout)

| Method | Endpoint       | Role                  | Deskripsi                                        |
| :----- | :------------- | :-------------------- | :------------------------------------------------ |
| POST   | `/api/orders`  | Semua (login)         | Proses checkout — catat transaksi & potong stok  |

**Body checkout:**
```json
{
  "table_id": 1,
  "items": [
    { "product_id": 3, "quantity": 2 },
    { "product_id": 7, "quantity": 1 }
  ]
}
```

Proses checkout menggunakan **PostgreSQL transaction** (`BEGIN / COMMIT / ROLLBACK`) dengan row-level locking (`SELECT ... FOR UPDATE`) untuk mencegah race condition saat stok dipotong.

---

### Dashboard

| Method | Endpoint                        | Role          | Deskripsi                                     |
| :----- | :------------------------------ | :------------ | :-------------------------------------------- |
| GET    | `/api/dashboard/cashier-stats`  | Admin, Owner  | Statistik transaksi & pendapatan per kasir    |

---

## Peran & Middleware

```
verifyToken → authorizeRole(['admin', 'owner'])
```

| Role    | Token Diverifikasi | Akses                                                   |
| :------ | :----------------- | :------------------------------------------------------ |
| `admin` | Ya                 | Semua endpoint — akses penuh                            |
| `owner` | Ya                 | Sama dengan admin — akses penuh                         |
| `kasir` | Ya                 | Hanya: GET produk (menu) + POST orders (checkout)       |

**JWT Secret:** Semua token menggunakan secret `'rahasia_super_secret'`, konsisten antara `authController.js` dan `authMiddleware.js`.

---

## Author

**Okiramadani** — Software Developer
