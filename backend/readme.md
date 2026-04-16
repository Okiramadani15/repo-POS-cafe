# POS Cafe Backend API - Mill 2

Sistem Backend Point of Sale (POS) profesional untuk manajemen Cafe yang dibangun menggunakan Node.js, Express, dan PostgreSQL. Sistem ini dirancang untuk menangani transaksi riil dengan keamanan tingkat tinggi, manajemen stok presisi, dan dokumentasi API yang interaktif.

## 🚀 Fitur Utama

* **Autentikasi & Otorisasi (RBAC)**: Sistem keamanan menggunakan **JWT (JSON Web Token)** dengan pembatasan akses berdasarkan peran (Role):
    * **Admin**: Akses penuh (CRUD Produk, Meja, Kategori, User).
    * **Kasir**: Fokus pada operasional transaksi (Checkout) dan manajemen Meja.
    * **Owner**: Akses khusus laporan dan statistik pendapatan (Dashboard).
* **Full CRUD Manajemen**: Pengelolaan data Produk (termasuk modal/cost price), Kategori, dan Meja secara dinamis.
* **Sistem Pesanan (Order)**: Mendukung transaksi multi-item dengan pencatatan harga historis menggunakan kolom `price_at_time`.
* **Manajemen Stok Otomatis**: Pengurangan stok produk secara otomatis menggunakan database transaction untuk mencegah data tidak konsisten.
* **Integritas Data**: Implementasi sistem `BEGIN`, `COMMIT`, dan `ROLLBACK` pada proses checkout untuk menjamin keamanan data transaksi.
* **Dokumentasi Swagger 3.0**: API yang mudah diuji melalui antarmuka grafis Swagger UI dengan dukungan **Bearer Authentication**.

## 🛠️ Tech Stack

* **Runtime**: Node.js
* **Framework**: Express.js
* **Database**: PostgreSQL
* **Keamanan**: BcryptJS (Hashing Password), JSONWebToken (JWT)
* **Dokumentasi**: Swagger UI Express (OpenAPI 3.0)

## 📋 Prasyarat

* Node.js (v14 atau lebih baru)
* PostgreSQL
* DBeaver atau tool database lainnya (untuk manajemen database manual)

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

Setelah server berjalan, akses dokumentasi interaktif untuk mencoba semua endpoint di:
`http://localhost:8080/api-docs`

### Daftar Endpoint Utama:

| Method | Endpoint | Role Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Login untuk mendapatkan Token JWT |
| `POST` | `/api/auth/register` | Admin | Mendaftarkan user baru |
| `GET` | `/api/products` | All | Daftar menu dengan filter kategori |
| `POST/PUT/DELETE` | `/api/products` | Admin | Manajemen data menu (CRUD) |
| `GET/POST` | `/api/tables` | All/Admin | Manajemen denah & status meja |
| `POST` | `/api/orders` | Admin, Kasir | Transaksi Checkout & Potong Stok |
| `GET` | `/api/dashboard/cashier-stats` | Admin, Owner | Statistik pendapatan & profit |

## 🗄️ Struktur Database Utama

Project ini menggunakan skema PostgreSQL yang dioptimalkan untuk performa:
* **`users`**: Data user, password (hashed), dan role.
* **`categories`**: Klasifikasi menu (Makanan, Minuman, Coffee, dll).
* **`products`**: Info menu, harga jual (`price`), harga modal (`cost_price`), dan stok.
* **`tables`**: Denah meja dengan status `available` atau `occupied`.
* **`orders`**: Header transaksi (Nomor Order, Total, ID Kasir).
* **`order_items`**: Detail item per transaksi dengan `price_at_time` untuk akurasi laporan meskipun harga produk berubah.

## 👤 Author

* **Okiramadani** - Software Developer