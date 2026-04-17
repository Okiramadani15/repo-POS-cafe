"use client";
import { useEffect, useState, useCallback } from 'react';
import api from '@/api/axiosConfig';
import { Tag, Plus, Pencil, Trash2, X, Loader2, Package } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get('/categories'),
        api.get('/products'),
      ]);
      const cats: Category[] = catRes.data.data ?? catRes.data;
      const prods = prodRes.data.data ?? prodRes.data;
      setCategories(cats);

      // Hitung jumlah produk per kategori
      const counts: Record<number, number> = {};
      prods.forEach((p: any) => {
        if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
      });
      setProductCounts(counts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => {
    setEditTarget(null);
    setName('');
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditTarget(cat);
    setName(cat.name);
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Nama kategori tidak boleh kosong'); return; }
    setSaving(true);
    setError('');
    try {
      if (editTarget) {
        await api.put(`/categories/${editTarget.id}`, { name: name.trim() });
        showToast('Kategori berhasil diupdate');
      } else {
        await api.post('/categories', { name: name.trim() });
        showToast('Kategori berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/categories/${deleteId}`);
      setCategories(prev => prev.filter(c => c.id !== deleteId));
      showToast('Kategori berhasil dihapus');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Gagal menghapus');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const deleteTarget = categories.find(c => c.id === deleteId);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-800 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kategori</h1>
          <p className="text-sm text-slate-500 font-light">Kelola kategori produk menu.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <Plus size={16} /> Tambah Kategori
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3 text-slate-300">
            <Tag size={40} />
            <p className="text-sm">Belum ada kategori</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Nama Kategori</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Jumlah Produk</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {categories.map(cat => (
                <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Tag size={14} className="text-blue-500" />
                      </div>
                      <span className="font-semibold text-slate-700">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-slate-500">
                      <Package size={13} className="text-slate-400" />
                      <span className="font-medium">{productCounts[cat.id] ?? 0} produk</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteId(cat.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-extrabold text-slate-800">
                {editTarget ? 'Edit Kategori' : 'Tambah Kategori'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Kategori</label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
                  placeholder="Contoh: Minuman, Makanan, Snack"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm hover:bg-slate-50">
                  Batal
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editTarget ? 'Simpan' : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-red-50 rounded-xl"><Trash2 size={20} className="text-red-500" /></div>
              <div>
                <h2 className="font-extrabold text-slate-800">Hapus Kategori?</h2>
                <p className="text-xs text-slate-400">Produk di kategori ini tidak akan ikut terhapus.</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl px-4 py-3 mb-5 text-sm font-semibold text-slate-700">
              "{deleteTarget?.name}"
              {(productCounts[deleteId] ?? 0) > 0 && (
                <span className="text-amber-600 ml-2">· {productCounts[deleteId]} produk akan kehilangan kategori</span>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm hover:bg-slate-50">
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
