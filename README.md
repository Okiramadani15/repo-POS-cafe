# POS Cafe — Point of Sale System

Sistem kasir (Point of Sale) fullstack untuk cafe/restoran. Dibangun dengan **Next.js 15**, **Express.js**, dan **PostgreSQL**. Mendukung multi-role, manajemen produk/meja/kategori, berbagai metode pembayaran, dan dashboard analitik real-time.

---

## Tech Stack

| Layer | Teknologi | Versi |
|:---|:---|:---|
| Frontend | Next.js, React, TypeScript | 15 / 19 / 5.7 |
| Styling | Tailwind CSS | v4 |
| Backend | Node.js + Express.js | 4.18 |
| Database | PostgreSQL (via `pg`) | 14+ |
| Auth | JWT + bcryptjs | 9 / 3 |
| Upload | Multer | 2 |
| Security | Helmet, express-rate-limit | — |
| API Docs | Swagger UI (`/api-docs`) | — |
| Icons | lucide-react | 0.473 |

---

## Fitur

### Halaman Kasir (`/pos`)
- Grid produk dengan filter kategori dan pencarian real-time
- Keranjang belanja — tambah, kurangi, hapus item, catatan pesanan
- Pilih meja (dropdown, hanya tampilkan status available)
- **6 metode pembayaran:** Tunai, QRIS, Transfer Bank, DANA, OVO, GoPay
- Kalkulator kembalian otomatis untuk pembayaran tunai
- Quick nominal (Rp5.000 – Rp200.000) untuk input cepat
- Struk sukses setelah transaksi
- Stok otomatis berkurang setelah checkout

### Dashboard Admin (`/admin/dashboard`)
- Ringkasan: total produk, order, meja, pendapatan total & hari ini
- Grafik revenue 7 hari terakhir (bar chart)
- Produk terlaris (top 5)
- Transaksi terbaru
- Performa kasir (filter: hari ini / bulan ini / tahun ini / semua)

### Manajemen Produk (`/admin/products`)
- CRUD: tambah, edit, hapus produk
- Upload gambar (JPG/PNG/WebP, maks 2 MB)
- Field: nama, kategori, harga jual, harga modal, stok, SKU

### Manajemen Kategori (`/admin/categories`)
- CRUD kategori
- Hapus kategori tidak menghapus produk (set `category_id` → null)

### Manajemen Meja (`/admin/tables`)
- CRUD meja dengan kapasitas dan nomor meja
- Denah lantai visual (grid, warna per status)
- Status real-time: Tersedia / Terisi / Dipesan
- Ubah status langsung dari tabel

### Manajemen Transaksi (`/admin/orders`)
- Tabel semua transaksi + filter pencarian dan rentang tanggal
- Modal detail order: item, kasir, meja, metode bayar, kembalian
- Hapus transaksi dengan konfirmasi
- Summary: total transaksi & total pendapatan

### Manajemen Karyawan (`/admin/staff`)
- CRUD akun karyawan
- Role: `owner` / `admin` / `kasir` (badge berwarna)
- Edit password opsional
- Proteksi: tidak bisa hapus akun sendiri

### Pengaturan (`/admin/settings`)
- Logo aplikasi: upload/reset (tampil di sidebar, login, header POS)
- Informasi toko: nama, tagline, telepon, alamat
- Ganti password akun aktif
- Tes koneksi server backend

---

## Struktur Proyek

```
Pos-cafe/
├── README.md
│
├── backend/
│   ├── index.js                    # Entry point — listen port 8080
│   ├── app.js                      # Express setup: middleware, routes, error handler
│   ├── .env                        # Environment variables (jangan di-commit)
│   ├── swagger.json                # Skema OpenAPI / Swagger
│   ├── migration_v2.sql            # Tambah kolom payment ke tabel orders
│   ├── migration_v3.sql            # Buat tabel app_settings
│   │
│   ├── config/
│   │   └── db.js                   # PostgreSQL Pool (pakai env vars)
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js       # verifyToken, authorizeRole
│   │   └── uploadMiddleware.js     # Multer: gambar produk (2 MB, JPG/PNG/WebP)
│   │
│   ├── controllers/
│   │   ├── authController.js       # register, login (+ rate limit per username)
│   │   ├── productController.js    # CRUD produk + upload gambar
│   │   ├── categoryController.js   # CRUD kategori
│   │   ├── tableController.js      # CRUD meja + update status
│   │   ├── orderController.js      # Checkout, list, detail, hapus order
│   │   ├── userController.js       # List, update, hapus user/karyawan
│   │   ├── dashboardController.js  # Summary, revenue chart, top products, cashier stats
│   │   └── settingsController.js   # Baca/simpan settings, upload/reset logo
│   │
│   ├── routes/
│   │   ├── authRoutes.js           # POST /api/auth/login|register
│   │   ├── productRoutes.js        # /api/products
│   │   ├── categoryRoutes.js       # /api/categories
│   │   ├── tableRoutes.js          # /api/tables
│   │   ├── orderRoutes.js          # /api/orders
│   │   ├── userRoutes.js           # /api/users
│   │   ├── dashboardRoutes.js      # /api/dashboard/*
│   │   └── settingsRoutes.js       # /api/settings
│   │
│   └── uploads/                    # File gambar tersimpan di sini (lokal)
│
└── frontend/
    ├── next.config.ts
    ├── tsconfig.json               # Path alias: @ → src/
    ├── .env.local                  # NEXT_PUBLIC_API_URL
    │
    └── src/
        ├── api/
        │   └── axiosConfig.ts      # Axios instance + JWT interceptor + error handler
        │
        ├── components/
        │   ├── Sidebar.tsx         # Navigasi admin + logo toko
        │   └── AdminGuard.tsx      # Guard: redirect non-admin / non-kasir
        │
        ├── hooks/
        │   └── useAppSettings.ts   # Fetch + cache settings toko (localStorage + event bus)
        │
        ├── types/
        │   └── index.ts            # TypeScript interfaces global
        │
        └── app/
            ├── layout.tsx          # Root layout
            ├── page.tsx            # Home → redirect ke /login
            ├── globals.css
            │
            ├── login/
            │   └── page.tsx        # Halaman login
            │
            ├── pos/
            │   └── page.tsx        # Halaman kasir (produk, keranjang, checkout)
            │
            └── admin/
                ├── layout.tsx      # Admin layout dengan Sidebar
                ├── dashboard/page.tsx
                ├── products/page.tsx
                ├── categories/page.tsx
                ├── tables/page.tsx
                ├── orders/page.tsx
                ├── staff/page.tsx
                └── settings/page.tsx
```

---

## Setup & Instalasi

### Prasyarat
- Node.js v18+
- PostgreSQL v14+
- npm

### 1. Clone & Install

```bash
# Backend
cd Pos-cafe/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Setup Database

```sql
-- Buat database
CREATE DATABASE "POS_cafe";

-- Tabel users
CREATE TABLE users (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username   VARCHAR(50) UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    role       VARCHAR(10) CHECK (role IN ('admin','kasir','owner')) NOT NULL,
    is_active  BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel categories
CREATE TABLE categories (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL
);

-- Tabel products
CREATE TABLE products (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(100) NOT NULL,
    price        NUMERIC(10,2) NOT NULL,
    cost_price   NUMERIC(10,2),
    stock        INTEGER DEFAULT 0,
    category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
    sku          VARCHAR(50),
    image_url    TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel tables (meja)
CREATE TABLE tables (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number VARCHAR(10) NOT NULL,
    capacity     INTEGER DEFAULT 4,
    status       VARCHAR(20) DEFAULT 'available',
    pos_x        INTEGER DEFAULT 0,
    pos_y        INTEGER DEFAULT 0
);

-- Tabel orders
CREATE TABLE orders (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no       VARCHAR(20) UNIQUE NOT NULL,
    user_id        UUID REFERENCES users(id),
    table_id       UUID REFERENCES tables(id),
    total_amount   NUMERIC(12,2) NOT NULL,
    status         VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(20) DEFAULT 'cash',
    payment_amount NUMERIC(10,2),
    change_amount  NUMERIC(10,2) DEFAULT 0,
    notes          TEXT,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel order_items
CREATE TABLE order_items (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id       UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id     UUID REFERENCES products(id),
    quantity       INTEGER NOT NULL,
    price_at_time  NUMERIC(10,2) NOT NULL
);
```

Kemudian jalankan migrasi:

```bash
psql -U postgres -d POS_cafe -f backend/migration_v2.sql
psql -U postgres -d POS_cafe -f backend/migration_v3.sql
```

### 3. Environment Variables

**`backend/.env`**
```env
PORT=8080
NODE_ENV=development
JWT_SECRET=ganti_dengan_string_panjang_acak_minimal_32_karakter
DB_HOST=localhost
DB_PORT=5432
DB_NAME=POS_cafe
DB_USER=postgres
DB_PASSWORD=password_database_kamu
ALLOWED_ORIGINS=http://localhost:3000
```

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 4. Buat Akun Owner Pertama

```sql
-- Password: admin123 — ganti segera setelah login pertama
INSERT INTO users (username, password, role)
VALUES (
  'admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHi',
  'owner'
);
```

### 5. Jalankan

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# Server  : http://localhost:8080
# Swagger : http://localhost:8080/api-docs

# Terminal 2 — Frontend
cd frontend
npm run dev
# Aplikasi: http://localhost:3000
```

---

## API Endpoints

### Auth

| Method | Endpoint | Akses | Keterangan |
|:---|:---|:---|:---|
| POST | `/api/auth/login` | Public | Login → JWT token |
| POST | `/api/auth/register` | Admin, Owner | Buat user baru |

### Produk

| Method | Endpoint | Akses | Keterangan |
|:---|:---|:---|:---|
| GET | `/api/products` | Semua | List produk, `?category_id=` |
| POST | `/api/products` | Admin, Owner | Tambah + upload gambar |
| PUT | `/api/products/:id` | Admin, Owner | Update |
| DELETE | `/api/products/:id` | Admin, Owner | Hapus |

### Kategori

| Method | Endpoint | Akses | Keterangan |
|:---|:---|:---|:---|
| GET | `/api/categories` | Semua | List kategori |
| POST | `/api/categories` | Admin, Owner | Tambah |
| PUT | `/api/categories/:id` | Admin, Owner | Update |
| DELETE | `/api/categories/:id` | Admin, Owner | Hapus (produk tidak terhapus) |

### Meja

| Method | Endpoint | Akses | Keterangan |
|:---|:---|:---|:---|
| GET | `/api/tables` | Login | List meja + status |
| POST | `/api/tables` | Admin, Owner | Tambah meja |
| PUT | `/api/tables/:id` | Login | Update data/status meja |
| DELETE | `/api/tables/:id` | Admin, Owner | Hapus meja |

### Transaksi

| Method | Endpoint | Akses | Keterangan |
|:---|:---|:---|:---|
| POST | `/api/orders` | Login | Checkout — potong stok, simpan order |
| GET | `/api/orders` | Admin, Owner | List + filter tanggal/status |
| GET | `/api/orders/:id` | Admin, Owner | Detail order + item |
| DELETE | `/api/orders/:id` | Admin, Owner | Hapus transaksi |

**Body `POST /api/orders`:**
```json
{
  "items": [{ "product_id": "uuid", "quantity": 2 }],
  "table_id": "uuid",
  "payment_method": "cash",
  "payment_amount": 50000,
  "notes": "Tanpa es"
}
```

> Metode pembayaran: `cash` | `qris` | `transfer` | `dana` | `ovo` | `gopay`

### Karyawan

| Method | Endpoint | Akses | Keterangan |
|:---|:---|:---|:---|
| GET | `/api/users` | Admin, Owner | List semua karyawan |
| PUT | `/api/users/:id` | Admin, Owner | Update username/role/password |
| DELETE | `/api/users/:id` | Admin, Owner | Hapus (tidak bisa hapus diri sendiri) |

### Dashboard

| Method | Endpoint | Akses | Keterangan |
|:---|:---|:---|:---|
| GET | `/api/dashboard/summary` | Admin, Owner | Total produk, order, revenue |
| GET | `/api/dashboard/revenue-chart` | Admin, Owner | Revenue 7 hari terakhir |
| GET | `/api/dashboard/top-products` | Admin, Owner | Produk terlaris |
| GET | `/api/dashboard/recent-orders` | Admin, Owner | 8 transaksi terakhir |
| GET | `/api/dashboard/cashier-stats` | Admin, Owner | Performa kasir `?period=today\|month\|year\|all` |

### Pengaturan

| Method | Endpoint | Akses | Keterangan |
|:---|:---|:---|:---|
| GET | `/api/settings` | Semua | Ambil semua setting toko |
| PUT | `/api/settings` | Admin, Owner | Update nama toko, tagline, telepon, alamat |
| POST | `/api/settings/logo` | Admin, Owner | Upload logo (maks 3 MB) |
| DELETE | `/api/settings/logo/:field` | Admin, Owner | Reset logo ke default |

---

## Role & Hak Akses

| Role | Halaman | Keterangan |
|:---|:---|:---|
| `owner` | Semua | Termasuk register admin/kasir baru |
| `admin` | Semua | Manajemen penuh, kecuali register owner |
| `kasir` | `/pos` saja | Hanya bisa transaksi |

---

## Arah Pengembangan

### Fase 1 — Penyempurnaan Operasional
- [ ] Cetak struk thermal (58mm) dari modal sukses POS
- [ ] Upload QR statis QRIS di Pengaturan
- [ ] Info rekening bank / nomor e-wallet di Pengaturan (tampil saat kasir pilih metode transfer)
- [ ] Tombol "Meja Selesai" — ubah status occupied → available setelah tamu bayar
- [ ] Stock alert di dashboard (stok < threshold)
- [ ] Laporan harian + export CSV

### Fase 2 — Peningkatan Fitur
- [ ] Shift kasir — buka/tutup shift, rekap per shift
- [ ] Pesanan pending — simpan sebelum dibayar
- [ ] Refund/void — batalkan transaksi + pulihkan stok
- [ ] Drag & drop denah meja (simpan ke `pos_x / pos_y`)
- [ ] Multi-printer: printer kasir + printer dapur

### Fase 3 — Integrasi Payment Gateway
Integrasi **Xendit** atau **Midtrans** untuk:
- [ ] QRIS dinamis — QR unik per transaksi, auto expired
- [ ] Virtual Account — BCA, BNI, BRI, Mandiri
- [ ] E-wallet otomatis — DANA, OVO, GoPay via API
- [ ] Webhook handler `/api/payment/webhook`
- [ ] Status pembayaran real-time (polling / WebSocket)

### Fase 4 — Produksi
- [ ] Deploy backend: Railway / Render / VPS (Nginx + PM2)
- [ ] Deploy frontend: Vercel
- [ ] Database hosted: Supabase / Railway PostgreSQL
- [ ] Upload gambar ke cloud: Cloudinary / AWS S3
- [ ] HTTPS + domain, backup otomatis, monitoring (Sentry + UptimeRobot)

---

## Catatan Teknis

| Item | Status | Keterangan |
|:---|:---|:---|
| `config/db.js` | ✅ Pakai `process.env` | Isi `DB_*` di `.env` sebelum jalankan |
| JWT Secret | ✅ Pakai `process.env.JWT_SECRET` | Wajib diisi, minimal 32 karakter |
| Upload gambar | ⚠️ Lokal (`/uploads`) | Migrasi ke Cloudinary/S3 untuk production |
| Pengaturan toko | ✅ Tersimpan di DB (`app_settings`) | Persistent, tidak hilang saat browser clear |
| Rate limiting login | ✅ Per IP + per username | Lockout 15 menit setelah 5 kali gagal |
| Swagger UI | ✅ Aktif di development | Nonaktif otomatis saat `NODE_ENV=production` |

---

## Author

**Oki Ramadani** — © 2026
