# POS Cafe — Frontend

Antarmuka web untuk sistem Point of Sale cafe, dibangun dengan **Next.js 16**, **React 19**, **TypeScript**, dan **Tailwind CSS 4**. Terhubung ke backend API melalui Axios dengan injeksi JWT otomatis.

---

## Tech Stack

| Komponen       | Library / Versi                  |
| :------------- | :------------------------------- |
| Framework      | Next.js 16.2.4 (App Router)      |
| UI Library     | React 19.2.4                     |
| Bahasa         | TypeScript 5                     |
| Styling        | Tailwind CSS 4 + PostCSS         |
| HTTP Client    | Axios 1.15.0                     |
| Icons          | Lucide React 1.8.0               |

---

## Struktur Direktori

```
frontend/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # Root layout (Geist font)
│   │   ├── page.tsx             # Redirect otomatis ke /login
│   │   ├── globals.css          # Global styles
│   │   ├── login/
│   │   │   └── page.tsx         # Halaman login (JWT authentication)
│   │   ├── pos/
│   │   │   └── page.tsx         # Interface kasir — menu + keranjang + checkout
│   │   └── admin/
│   │       ├── layout.tsx       # Admin layout dengan sidebar navigasi
│   │       ├── dashboard/
│   │       │   └── page.tsx     # Dashboard statistik (admin, owner)
│   │       ├── products/
│   │       │   └── page.tsx     # Manajemen produk CRUD (admin)
│   │       ├── manage-users/
│   │       │   └── page.tsx     # Manajemen akun staff (admin)
│   │       └── orders/          # Riwayat transaksi (admin)
│   ├── api/
│   │   └── axiosConfig.ts       # Axios instance + JWT interceptor
│   ├── components/
│   │   ├── AdminGuard.tsx       # Proteksi route berdasarkan role
│   │   └── Sidebar.tsx          # Sidebar navigasi admin
│   └── types/
│       └── index.ts             # TypeScript interfaces (Product, CartItem, Category)
├── public/                      # Static assets
├── next.config.ts
├── tsconfig.json
└── postcss.config.mjs
```

---

## Instalasi & Setup

### 1. Install Dependensi

```bash
cd Pos-cafe/frontend
npm install
```

### 2. Konfigurasi API Base URL

Base URL backend dikonfigurasi di [src/api/axiosConfig.ts](src/api/axiosConfig.ts):

```ts
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  // ...
});
```

Ubah `baseURL` jika backend berjalan di host/port yang berbeda.

### 3. Jalankan Development Server

```bash
npm run dev
```

Aplikasi berjalan di: `http://localhost:3000`

### 4. Build untuk Production

```bash
npm run build
npm start
```

---

## Halaman & Akses

| Route                    | Role yang Diizinkan  | Deskripsi                                               |
| :----------------------- | :------------------- | :------------------------------------------------------ |
| `/login`                 | Public               | Form login — simpan token ke localStorage               |
| `/pos`                   | kasir                | Interface POS — lihat menu, keranjang, checkout         |
| `/admin/dashboard`       | admin, owner         | Statistik pendapatan & performa kasir                   |
| `/admin/products`        | admin, owner         | CRUD produk — tambah, edit, hapus                       |
| `/admin/manage-users`    | admin, owner         | Tambah & kelola akun staff                              |
| `/admin/orders`          | admin, owner         | Riwayat dan detail transaksi                            |

---

## Autentikasi & Proteksi Route

### Alur Login

1. User submit form di `/login`
2. Response dari backend menyimpan `token`, `role`, dan `username` ke `localStorage`
3. Redirect otomatis berdasarkan role:
   - `admin` / `owner` → `/admin/dashboard`
   - `kasir` → `/pos`
4. Axios interceptor otomatis menyertakan token di header `Authorization: Bearer <token>` untuk setiap request
5. Jika response `401 Unauthorized`, token dihapus dan user diarahkan kembali ke `/login`

### Proteksi Halaman Admin

Komponen `AdminGuard` ([src/components/AdminGuard.tsx](src/components/AdminGuard.tsx)) membaca `role` dari `localStorage`:
- `admin` atau `owner` → diizinkan masuk ke semua halaman `/admin/*`
- `kasir` → ditolak, dialihkan ke `/pos`

---

## Konfigurasi TypeScript

Path alias `@/*` tersedia untuk import lebih bersih:

```ts
import api from '@/api/axiosConfig';
import { Product } from '@/types';
```

---

## Perintah Tersedia

```bash
npm run dev      # Development server dengan hot reload
npm run build    # Build produksi
npm run start    # Jalankan build produksi
npm run lint     # Cek ESLint
```

---

## Author

**Okiramadani** — Software Developer
