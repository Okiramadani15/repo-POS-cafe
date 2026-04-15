# POS Cafe Backend API 

Sistem Backend Point of Sale (POS) profesional untuk manajemen Cafe yang dibangun menggunakan Node.js, Express, dan PostgreSQL. Sistem ini dirancang untuk menangani transaksi riil dengan keamanan tingkat tinggi dan integritas data yang solid.

## 🚀 Fitur Utama

* **Autentikasi & Otorisasi (RBAC)**: Sistem keamanan menggunakan **JWT (JSON Web Token)** dengan pembatasan akses berdasarkan peran (Role):
    * **Admin**: Memiliki akses penuh, termasuk mendaftarkan user baru.
    * **Kasir**: Fokus pada operasional transaksi (Checkout).
    * **Owner**: Akses khusus laporan dan statistik pendapatan (Dashboard).
* **Sistem Pesanan (Order)**: Mendukung transaksi multi-item dengan pencatatan harga historis menggunakan kolom `price_at_time`.
* **Manajemen Stok Otomatis**: Pengurangan stok produk secara otomatis menggunakan database transaction untuk mencegah data tidak konsisten.
* **Integritas Data**: Implementasi sistem `BEGIN`, `COMMIT`, dan `ROLLBACK` pada proses checkout untuk menjamin keamanan data transaksi.
* **Dokumentasi Swagger**: API yang mudah diuji melalui antarmuka grafis dengan dukungan **Bearer Authentication**.

## 🛠️ Tech Stack

* **Runtime**: Node.js
* **Framework**: Express.js
* **Database**: PostgreSQL
* **Keamanan**: BcryptJS (Hashing Password), JSONWebToken (JWT)
* **Dokumentasi**: Swagger UI Express (OpenAPI 3.0)

## 📋 Prasyarat

* Node.js (v14 atau lebih baru)
* PostgreSQL
* DBeaver atau tool database lainnya

## ⚙️ Instalasi

1.  **Clone repository**:
    ```bash
    git clone [https://github.com/Okiramadani15/POS_project.git](https://github.com/Okiramadani15/POS_project.git)
    cd POS_project
    ```

2.  **Instal dependensi**:
    ```bash
    npm install
    ```

3.  **Konfigurasi database** di `config/db.js`:
    Pastikan kredensial sesuai dengan database `POS_cafe` di lokal atau server Anda.

4.  **Jalankan server**:
    ```bash
    npx nodemon index.js
    ```

## 📖 Dokumentasi API

Setelah server berjalan, dokumentasi API dapat diakses di:
`http://localhost:8080/api-docs`

### Daftar Endpoint Utama:

| Method | Endpoint | Role Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Login untuk mendapatkan Token JWT |
| `POST` | `/api/auth/register` | Admin | Mendaftarkan user baru (Admin/Kasir/Owner) |
| `GET` | `/api/products` | All | Mengambil daftar menu produk & stok |
| `POST` | `/api/orders` | Admin, Kasir | Membuat pesanan baru & potong stok |
| `GET` | `/api/dashboard/cashier-stats` | Admin, Owner | Melihat statistik pendapatan |

## 🗄️ Struktur Database

Project ini menggunakan skema PostgreSQL dengan tabel-tabel utama:
* **`users`**: Menyimpan data user, password (hashed), dan role.
* **`products`**: Menyimpan informasi menu, harga, dan stok terkini.
* **`orders`**: Header transaksi (Nomor Order, Total, ID Kasir).
* **`order_items`**: Detail item per transaksi dengan kolom `price_at_time` untuk menjaga akurasi laporan keuangan meskipun harga produk berubah di masa depan.

## 👤 Author

* **Okiramadani** - Software Developer