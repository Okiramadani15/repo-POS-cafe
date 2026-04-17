# POS Cafe — Point of Sale System

Sistem kasir (Point of Sale) fullstack untuk cafe/restoran. Dibangun dengan **Next.js 15**, **Express.js**, dan **PostgreSQL**. Mendukung multi-role, manajemen produk/meja/kategori, berbagai metode pembayaran, dan dashboard analitik real-time.

---

## Tech Stack

| Layer | Teknologi |
|:---|:---|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v4 |
| Backend | Node.js, Express.js 4.18, PostgreSQL (via `pg`) |
| Auth | JWT (jsonwebtoken 9), bcryptjs |
| Upload | Multer (gambar produk, max 2MB) |
| Security | Helmet, express-rate-limit, CORS manual |
| API Docs | Swagger UI (`/api-docs`) |
| Icons | lucide-react |

---

## Fitur yang Sudah Dibangun

### Halaman Kasir (`/pos`)
- Grid produk dengan filter kategori tab dan pencarian real-time
- Keranjang belanja — tambah, kurangi, hapus item
- Pilih meja (dropdown dengan status available/occupied)
- Catatan pesanan dan diskon
- **6 metode pembayaran:** Tunai, QRIS, Transfer Bank, DANA, OVO, GoPay
- Kalkulator kembalian otomatis untuk pembayaran tunai
- Quick nominal (Rp5.000 – Rp100.000) untuk kasir cepat
- Struk sukses setelah transaksi berhasil
- Stok otomatis berkurang setelah checkout

### Dashboard Admin (`/admin/dashboard`)
- Ringkasan: total produk, order, meja, pendapatan total & hari ini
- Grafik revenue 7 hari terakhir (bar chart)
- Produk terlaris (top 5)
- Transaksi terbaru
- Performa kasir (filter: hari ini / bulan ini / tahun ini / semua)

### Manajemen Produk (`/admin/products`)
- CRUD lengkap: tambah, edit, hapus produk
- Upload gambar (JPG/PNG/WebP, maks 2MB)
- Filter kategori, harga jual, harga modal, stok, SKU

### Manajemen Kategori (`/admin/categories`)
- CRUD lengkap: tambah, edit, hapus kategori
- Tampil jumlah produk per kategori
- Hapus kategori tidak menghapus produk (set ke null)

### Manajemen Meja (`/admin/tables`)
- CRUD lengkap: tambah, edit, hapus meja
- Denah lantai visual (grid dengan warna status)
- Status real-time: Tersedia / Terisi / Dipesan
- Ubah status langsung dari tabel (dropdown inline)
- Kapasitas per meja

### Manajemen Transaksi (`/admin/orders`)
- Tabel semua transaksi dengan filter pencarian dan rentang tanggal
- Modal detail order: item, kasir, meja, metode bayar
- Hapus transaksi dengan konfirmasi
- Summary: total transaksi & total pendapatan

### Manajemen Karyawan (`/admin/staff`)
- CRUD lengkap: tambah, edit, hapus akun
- Role: owner / admin / kasir (badge berwarna)
- Edit password opsional (kosongkan jika tidak diubah)
- Tidak bisa hapus akun sendiri

### Pengaturan (`/admin/settings`)
- Informasi toko: nama, tagline, telepon, alamat (disimpan di localStorage)
- Ganti password akun aktif
- Tes koneksi ke server backend

---

## Struktur Proyek

```
Pos-cafe/
├── backend/
│   ├── index.js                  # Entry point, port 8080
│   ├── app.js                    # Express + middleware + routes
│   ├── migration_v2.sql          # Jalankan setelah setup awal
│   ├── config/
│   │   └── db.js                 # PostgreSQL pool
│   ├── middleware/
│   │   ├── authMiddleware.js     # verifyToken, authorizeRole
│   │   └── uploadMiddleware.js   # multer (gambar produk)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── categoryController.js
│   │   ├── tableController.js
│   │   ├── orderController.js
│   │   ├── userController.js
│   │   └── dashboardController.js
│   └── routes/
│       ├── authRoutes.js
│       ├── productRoutes.js
│       ├── categoryRoutes.js
│       ├── tableRoutes.js
│       ├── orderRoutes.js
│       ├── userRoutes.js
│       └── dashboardRoutes.js
│
└── frontend/
    └── src/
        ├── api/
        │   └── axiosConfig.ts        # Axios instance + interceptor JWT
        ├── components/
        │   ├── Sidebar.tsx           # Navigasi admin
        │   └── AdminGuard.tsx        # Guard redirect non-admin
        └── app/
            ├── login/page.tsx
            ├── pos/page.tsx          # Halaman kasir
            └── admin/
                ├── layout.tsx        # Layout dengan sidebar
                ├── dashboard/
                ├── products/
                ├── categories/
                ├── tables/
                ├── orders/
                ├── staff/
                └── settings/
```

---

## Setup & Instalasi

### Prasyarat
- Node.js v18+
- PostgreSQL v14+
- npm atau yarn

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
    id         SERIAL PRIMARY KEY,
    username   VARCHAR(50) UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    role       VARCHAR(10) CHECK (role IN ('admin','kasir','owner')) NOT NULL,
    is_active  BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel categories
CREATE TABLE categories (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

-- Tabel products
CREATE TABLE products (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    price        NUMERIC(10,2) NOT NULL,
    cost_price   NUMERIC(10,2),
    stock        INTEGER DEFAULT 0,
    category_id  INTEGER REFERENCES categories(id),
    sku          VARCHAR(50),
    image_url    TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel tables (meja)
CREATE TABLE tables (
    id           SERIAL PRIMARY KEY,
    table_number VARCHAR(10) NOT NULL,
    capacity     INTEGER DEFAULT 4,
    status       VARCHAR(20) DEFAULT 'available',
    pos_x        INTEGER DEFAULT 0,
    pos_y        INTEGER DEFAULT 0
);

-- Tabel orders
CREATE TABLE orders (
    id             SERIAL PRIMARY KEY,
    order_no       VARCHAR(30) UNIQUE NOT NULL,
    user_id        INTEGER REFERENCES users(id),
    table_id       INTEGER REFERENCES tables(id),
    total_amount   NUMERIC(10,2) NOT NULL,
    discount       NUMERIC(10,2) DEFAULT 0,
    status         VARCHAR(20) DEFAULT 'success',
    payment_method VARCHAR(20) DEFAULT 'cash',
    payment_amount NUMERIC(10,2),
    change_amount  NUMERIC(10,2) DEFAULT 0,
    notes          TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel order_items
CREATE TABLE order_items (
    id             SERIAL PRIMARY KEY,
    order_id       INTEGER REFERENCES orders(id),
    product_id     INTEGER REFERENCES products(id),
    quantity       INTEGER NOT NULL,
    price_at_time  NUMERIC(10,2) NOT NULL
);
```

> Jika database sudah ada dari versi sebelumnya, jalankan:
> ```bash
> psql -U postgres -d POS_cafe -f backend/migration_v2.sql
> ```

### 3. Environment Variables

**`backend/.env`**
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

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_APP_NAME=Point of Sale
```

### 4. Buat Akun Owner Pertama

```sql
-- Jalankan di psql (password: admin123 — ganti setelah login pertama)
INSERT INTO users (username, password, role)
VALUES (
  'admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHi',
  'owner'
);
```

> Password hash di atas adalah `admin123`. Ganti segera via menu Pengaturan setelah login.

### 5. Jalankan

```bash
# Terminal 1 — Backend
cd backend
npx nodemon index.js
# Server: http://localhost:8080
# Swagger: http://localhost:8080/api-docs

# Terminal 2 — Frontend
cd frontend
npm run dev
# Aplikasi: http://localhost:3000
```

---

## API Endpoints

### Auth
| Method | Endpoint | Role | Keterangan |
|:---|:---|:---|:---|
| POST | `/api/auth/login` | Public | Login → JWT token |
| POST | `/api/auth/register` | Admin, Owner | Buat user baru |

### Produk
| Method | Endpoint | Role | Keterangan |
|:---|:---|:---|:---|
| GET | `/api/products` | Semua | List produk, filter `?category_id=` |
| POST | `/api/products` | Admin, Owner | Tambah + upload gambar |
| PUT | `/api/products/:id` | Admin, Owner | Update |
| DELETE | `/api/products/:id` | Admin, Owner | Hapus |

### Kategori
| Method | Endpoint | Role | Keterangan |
|:---|:---|:---|:---|
| GET | `/api/categories` | Semua | List kategori |
| POST | `/api/categories` | Admin, Owner | Tambah |
| PUT | `/api/categories/:id` | Admin, Owner | Update |
| DELETE | `/api/categories/:id` | Admin, Owner | Hapus (produk tidak terhapus) |

### Meja
| Method | Endpoint | Role | Keterangan |
|:---|:---|:---|:---|
| GET | `/api/tables` | Login | List meja + status |
| POST | `/api/tables` | Admin, Owner | Tambah meja |
| PUT | `/api/tables/:id` | Login | Update data/status meja |
| DELETE | `/api/tables/:id` | Admin, Owner | Hapus (cek jika sedang occupied) |

### Transaksi
| Method | Endpoint | Role | Keterangan |
|:---|:---|:---|:---|
| POST | `/api/orders` | Login | Checkout — potong stok + simpan order |
| GET | `/api/orders` | Admin, Owner | List transaksi + filter |
| GET | `/api/orders/:id` | Admin, Owner | Detail order + item |
| DELETE | `/api/orders/:id` | Admin, Owner | Hapus transaksi |

**Body POST `/api/orders`:**
```json
{
  "items": [{ "product_id": 1, "quantity": 2 }],
  "table_id": 3,
  "payment_method": "cash",
  "payment_amount": 50000,
  "discount": 0,
  "notes": "Tanpa es"
}
```
Metode pembayaran: `cash` | `qris` | `transfer` | `dana` | `ovo` | `gopay`

### Users / Karyawan
| Method | Endpoint | Role | Keterangan |
|:---|:---|:---|:---|
| GET | `/api/users` | Admin, Owner | List semua karyawan |
| PUT | `/api/users/:id` | Admin, Owner | Update username/role/password |
| DELETE | `/api/users/:id` | Admin, Owner | Hapus (tidak bisa hapus diri sendiri) |

### Dashboard
| Method | Endpoint | Role | Keterangan |
|:---|:---|:---|:---|
| GET | `/api/dashboard/summary` | Admin, Owner | Total produk, order, revenue |
| GET | `/api/dashboard/revenue-chart` | Admin, Owner | Revenue 7 hari terakhir |
| GET | `/api/dashboard/top-products` | Admin, Owner | Produk terlaris |
| GET | `/api/dashboard/recent-orders` | Admin, Owner | 8 transaksi terakhir |
| GET | `/api/dashboard/cashier-stats` | Admin, Owner | Performa kasir `?period=today\|month\|year` |

---

## Role & Hak Akses

| Role | Akses |
|:---|:---|
| `owner` | Semua fitur + bisa register admin baru |
| `admin` | Semua fitur manajemen |
| `kasir` | Hanya halaman `/pos` (transaksi & lihat produk) |

---

## Arah Pengembangan

### Fase 1 — Penyempurnaan Operasional *(prioritas segera)*

- [ ] **Cetak struk** — `window.print()` dari modal sukses POS, layout thermal printer 58mm
- [ ] **Nomor rekening & e-wallet di Pengaturan** — isi info bank/DANA/OVO/GoPay yang tampil saat kasir pilih metode transfer
- [ ] **QR statis QRIS** — upload gambar QR toko di Pengaturan sebelum integrasi payment gateway
- [ ] **Laporan harian** — halaman rekap transaksi per hari, bisa filter tanggal + export CSV
- [ ] **Stock alert** — notifikasi di dashboard ketika stok produk di bawah threshold (misal < 5)
- [ ] **Tombol "Meja Selesai"** — ubah status meja dari occupied → available setelah tamu bayar

### Fase 2 — Peningkatan Fitur *(1–3 bulan)*

- [ ] **Shift kasir** — buka/tutup shift, rekap pendapatan per shift, histori shift
- [ ] **Diskon per produk** — selain diskon total order, bisa set diskon per item di menu
- [ ] **Promo / voucher** — kode promo dengan batas pemakaian dan tanggal berlaku
- [ ] **Drag & drop denah meja** — simpan posisi meja ke `pos_x / pos_y` dengan antarmuka visual
- [ ] **Multi-printer** — printer kasir (struk) + printer dapur (tiket pesanan masak)
- [ ] **Pesanan pending** — simpan pesanan sebelum dibayar, kasir bisa kembali ke meja lain dulu
- [ ] **Refund / void** — pembatalan transaksi dengan pemulihan stok otomatis

### Fase 3 — Integrasi Payment Gateway *(setelah Fase 1 selesai)*

Integrasi dengan **Xendit** atau **Midtrans** untuk:

- [ ] **QRIS dinamis** — QR unik per transaksi, otomatis expired & terverifikasi
- [ ] **Virtual Account** — BCA, BNI, BRI, Mandiri — auto cek lunas via webhook
- [ ] **E-wallet otomatis** — DANA, OVO, GoPay via deep-link atau API
- [ ] **Webhook handler** — endpoint `/api/payment/webhook` untuk terima notifikasi lunas
- [ ] **Status pembayaran real-time** — polling atau WebSocket di POS page

**Rekomendasi:** Mulai dengan **Xendit** karena dokumentasi lebih ramah pemula, sandbox gratis, dan QRIS-nya mendukung semua bank/e-wallet Indonesia.

```
Alur integrasi:
POST /api/orders → buat order → request QR/VA ke Xendit
                              ↓
                    Xendit kirim notifikasi ke webhook
                              ↓
                    Backend update status order → 'paid'
                              ↓
                    Frontend polling/WebSocket → tampil sukses
```

### Fase 4 — Skala & Produksi *(persiapan go-live)*

- [ ] **Deploy backend** — Railway / Render / VPS (Nginx + PM2)
- [ ] **Deploy frontend** — Vercel (Next.js native)
- [ ] **Database hosted** — Supabase / Railway PostgreSQL / Neon
- [ ] **Upload gambar ke cloud** — Cloudinary atau AWS S3 (ganti dari `uploads/` lokal)
- [ ] **Redis session** — ganti in-memory rate limiter ke Redis untuk multi-instance
- [ ] **HTTPS + domain** — SSL via Let's Encrypt
- [ ] **Backup otomatis database** — pg_dump harian via cron
- [ ] **Monitoring** — Sentry (error tracking) + UptimeRobot (availability)

### Fase 5 — Fitur Lanjutan *(opsional, jangka panjang)*

- [ ] **Aplikasi mobile kasir** — React Native / Expo (scan barcode, tampilan touch-friendly)
- [ ] **Customer display** — layar kedua untuk pelanggan melihat pesanan & total
- [ ] **Loyalty program** — poin reward pelanggan, histori pembelian
- [ ] **Manajemen supplier** — pencatatan pembelian stok, hutang supplier
- [ ] **Multi-outlet** — satu dashboard owner untuk beberapa cabang
- [ ] **Integrasi akuntansi** — ekspor ke format Jurnal / Accurate / laporan keuangan

---

## Catatan Teknis Penting

| Issue | Status | Keterangan |
|:---|:---|:---|
| `db.js` masih hardcode kredensial | ⚠️ Perbaiki sebelum deploy | Pindahkan ke `process.env` |
| JWT secret di authMiddleware | ✅ Sudah pakai `process.env.JWT_SECRET` | Pastikan `.env` terisi |
| Upload gambar lokal (`/uploads`) | ⚠️ Tidak cocok untuk cloud deploy | Migrasi ke Cloudinary/S3 di Fase 4 |
| Pengaturan toko di localStorage | ⚠️ Hilang jika browser clear | Buat tabel `settings` di DB di Fase 2 |
| Nomor rekening/e-wallet | ⚠️ Belum ada | Isi manual di Pengaturan (Fase 1) |

---

## Author

**Oki Ramadani** — © 2026
