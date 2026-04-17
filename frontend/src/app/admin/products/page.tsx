"use client";
import React, { useEffect, useRef, useState } from 'react';
import api from '@/api/axiosConfig';
import { Plus, Pencil, Trash2, X, Loader2, ImageIcon } from 'lucide-react';

interface CategoryItem {
  id: number;
  name: string;
}

interface ProductItem {
  id: number;
  name: string;
  price: number;
  cost_price: number;
  stock: number;
  category_id: number | null;
  category_name: string;
  sku: string;
  image_url: string | null;
}

interface FormState {
  id?: number;
  name: string;
  price: number;
  cost_price: number;
  stock: number;
  category_id: string;
  sku: string;
  image_url: string;
}

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:8080';

const emptyForm = (): FormState => ({
  name: '',
  price: 0,
  cost_price: 0,
  stock: 0,
  category_id: '',
  sku: '',
  image_url: '',
});

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      const data = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
      setProducts(data);
    } catch {
      console.error('Gagal mengambil produk');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      const data = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
      setCategories(data);
    } catch {
      console.error('Gagal mengambil kategori');
    }
  };

  const handleOpenModal = (product?: ProductItem) => {
    if (product) {
      setForm({
        id: product.id,
        name: product.name,
        price: product.price,
        cost_price: product.cost_price,
        stock: product.stock,
        category_id: product.category_id ? String(product.category_id) : '',
        sku: product.sku ?? '',
        image_url: product.image_url ?? '',
      });
      setImagePreview(product.image_url ? `${BACKEND_URL}${product.image_url}` : null);
    } else {
      setForm(emptyForm());
      setImagePreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const body = new FormData();
      body.append('name', form.name);
      body.append('price', String(form.price));
      body.append('cost_price', String(form.cost_price));
      body.append('stock', String(form.stock));
      // Kirim category_id hanya jika terisi — hindari empty string ke DB
      if (form.category_id) {
        body.append('category_id', form.category_id);
      }
      body.append('sku', form.sku);
      if (imageFile) {
        body.append('image', imageFile);
      } else if (form.image_url) {
        body.append('image_url', form.image_url);
      }

      // Jangan set Content-Type secara manual — biarkan axios menambahkan
      // boundary yang benar secara otomatis saat mendeteksi FormData
      if (form.id) {
        await api.put(`/products/${form.id}`, body);
      } else {
        await api.post('/products', body);
      }
      await fetchProducts();
      setIsModalOpen(false);
    } catch {
      alert('Gagal menyimpan produk');
    } finally {
      setSubmitLoading(false);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Hapus produk ini?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('Gagal menghapus produk');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Produk</h1>
          <p className="text-sm text-slate-500 font-light">Kelola menu cafe kamu.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <Plus size={18} />
          Tambah Produk
        </button>
      </div>

      {/* Tabel */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={36} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Produk</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Kategori</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Harga</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Stok</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    Belum ada produk.
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <img
                            src={`${BACKEND_URL}${product.image_url}`}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300">
                            <ImageIcon size={18} />
                          </div>
                        )}
                        <span className="font-medium text-slate-700">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{product.category_name ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">
                      Rp {Number(product.price).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${product.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => !submitLoading && setIsModalOpen(false)}
          />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {form.id ? 'Edit Produk' : 'Produk Baru'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">

              {/* Upload Gambar */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Gambar Produk
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center h-36 hover:border-blue-400 transition-colors overflow-hidden bg-slate-50"
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <ImageIcon size={28} className="text-slate-300 mb-2" />
                      <p className="text-xs text-slate-400">Klik untuk unggah gambar</p>
                      <p className="text-[10px] text-slate-300">JPG, PNG, WebP · maks 2 MB</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); setForm(f => ({ ...f, image_url: '' })); }}
                    className="mt-1 text-xs text-red-400 hover:text-red-600"
                  >
                    Hapus gambar
                  </button>
                )}
              </div>

              {/* Nama */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Produk</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Contoh: Es Kopi Susu"
                />
              </div>

              {/* Kategori & Stok */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Kategori</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.category_id}
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                  >
                    <option value="">— Pilih —</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Stok</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.stock}
                    onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              {/* Harga Jual & Modal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Harga Jual (Rp)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Harga Modal (Rp)</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.cost_price}
                    onChange={e => setForm(f => ({ ...f, cost_price: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">SKU (opsional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={form.sku}
                  onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                  placeholder="Contoh: KOP-001"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                >
                  {submitLoading ? <Loader2 className="animate-spin" size={18} /> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
