# POS Cafe Backend API

Sistem Backend Point of Sale (POS) sederhana untuk manajemen Cafe yang dibangun menggunakan Node.js, Express, dan PostgreSQL. Project ini dilengkapi dengan dokumentasi API menggunakan Swagger UI.

## 🚀 Fitur Utama

* **Manajemen Produk**: Mendapatkan daftar menu berdasarkan kategori.
* **Sistem Pesanan (Order)**: Mendukung transaksi multi-item.
* **Manajemen Stok Otomatis**: Stok produk berkurang secara otomatis setiap kali ada transaksi yang berhasil.
* **Database Transaction**: Menjamin integritas data menggunakan sistem `BEGIN`, `COMMIT`, dan `ROLLBACK`.
* **Dokumentasi Swagger**: API yang mudah diuji melalui antarmuka grafis.

## 🛠️ Tech Stack

* **Runtime**: Node.js
* **Framework**: Express.js
* **Database**: PostgreSQL
* **Documentation**: Swagger UI Express
* **Tooling**: Nodemon, PG (node-postgres)

## 📋 Prasyarat

* Node.js (v14 atau lebih baru)
* PostgreSQL
* DBeaver atau tool database lainnya

## ⚙️ Instalasi

1.  Clone repository:
    ```bash
    git clone https://github.com/Okiramadani15/POS_project.git
    cd POS_project
    ```

2.  Instal dependensi:
    ```bash
    npm install
    ```

3.  Konfigurasi database di `config/db.js`:
    ```javascript
    const { Pool } = require('pg');
    const pool = new Pool({
      user: 'your_username',
      host: 'localhost',
      database: 'POS_cafe',
      password: 'your_password',
      port: 5432,
    });
    ```

4.  Jalankan server:
    ```bash
    npx nodemon index.js
    ```

## 📖 Dokumentasi API

Setelah server berjalan, Anda dapat mengakses dokumentasi API di:
`http://localhost:8080/api-docs`

### Endpoint Utama:

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/products` | Mengambil semua daftar menu produk |
| `POST` | `/api/orders` | Membuat pesanan baru & update stok |

## 🗄️ Struktur Database

Project ini menggunakan skema database PostgreSQL dengan tabel-tabel utama:
* `products`: Menyimpan informasi menu dan stok.
* `orders`: Menyimpan informasi transaksi utama.
* `order_items`: Menyimpan detail item di setiap transaksi (terhubung ke produk).

## 👤 Author

* **Okiramadani** - Software Developer
