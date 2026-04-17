"use client";
import { useEffect, useState, useCallback } from 'react';
import api from '@/api/axiosConfig';
import {
  LayoutGrid, Plus, Pencil, Trash2, X, Loader2,
  Users, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';

interface TableItem {
  id: number;
  table_number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  pos_x: number;
  pos_y: number;
}

interface FormState {
  id?: number;
  table_number: string;
  capacity: number;
}

const STATUS_CONFIG = {
  available: { label: 'Tersedia',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: <CheckCircle2 size={12} /> },
  occupied:  { label: 'Terisi',     color: 'bg-rose-50    text-rose-700    border-rose-200',    dot: 'bg-rose-500',    icon: <Users size={12} /> },
  reserved:  { label: 'Dipesan',    color: 'bg-amber-50   text-amber-700   border-amber-200',   dot: 'bg-amber-500',   icon: <Clock size={12} /> },
};

export default function TablesPage() {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ table_number: '', capacity: 4 });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusChanging, setStatusChanging] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tables');
      setTables(res.data.data ?? res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const openAdd = () => { setForm({ table_number: '', capacity: 4 }); setError(''); setIsModalOpen(true); };
  const openEdit = (t: TableItem) => { setForm({ id: t.id, table_number: t.table_number, capacity: t.capacity }); setError(''); setIsModalOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (form.id) {
        await api.put(`/tables/${form.id}`, { table_number: form.table_number, capacity: form.capacity });
        showToast('Meja berhasil diupdate');
      } else {
        await api.post('/tables', { table_number: form.table_number, capacity: form.capacity });
        showToast('Meja berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchTables();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan');
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    setStatusChanging(id);
    try {
      await api.put(`/tables/${id}`, { status: newStatus });
      setTables(prev => prev.map(t => t.id === id ? { ...t, status: newStatus as any } : t));
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Gagal update status');
    } finally { setStatusChanging(null); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/tables/${deleteId}`);
      setTables(prev => prev.filter(t => t.id !== deleteId));
      showToast('Meja berhasil dihapus');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Gagal menghapus');
    } finally { setDeleting(false); setDeleteId(null); }
  };

  const count = (s: string) => tables.filter(t => t.status === s).length;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-800 text-white text-sm px-4 py-3 rounded-xl shadow-lg">{toast}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Meja</h1>
          <p className="text-sm text-slate-500 font-light">Atur meja dan pantau status real-time.</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-100 active:scale-95">
          <Plus size={16} /> Tambah Meja
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {(['available', 'occupied', 'reserved'] as const).map(s => {
          const cfg = STATUS_CONFIG[s];
          return (
            <div key={s} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${cfg.color}`}>
                {cfg.icon}
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-800">{count(s)}</p>
                <p className="text-xs text-slate-500 font-medium">{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floor Map Visual */}
      {!loading && tables.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="font-bold text-slate-700 mb-4 text-sm flex items-center gap-2">
            <LayoutGrid size={15} className="text-blue-500" /> Denah Lantai
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {tables.map(t => {
              const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.available;
              return (
                <div key={t.id}
                  className={`relative border-2 rounded-xl p-3 flex flex-col items-center gap-1 cursor-pointer transition-all hover:scale-105 ${cfg.color}`}
                  title={`Meja ${t.table_number} — ${cfg.label}`}
                >
                  <span className="text-lg font-extrabold">{t.table_number}</span>
                  <div className="flex items-center gap-1 text-[10px] font-medium opacity-80">
                    <Users size={9} /> {t.capacity}
                  </div>
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-5 mt-4 pt-4 border-t border-slate-100">
            {(['available', 'occupied', 'reserved'] as const).map(s => {
              const cfg = STATUS_CONFIG[s];
              return (
                <div key={s} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : tables.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3 text-slate-300">
            <LayoutGrid size={40} /><p className="text-sm">Belum ada meja</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">No. Meja</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Kapasitas</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Ubah Status</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tables.map(t => {
                const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.available;
                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold border ${cfg.color}`}>
                          {t.table_number}
                        </div>
                        <span className="font-bold text-slate-700">Meja {t.table_number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-500">
                        <Users size={13} className="text-slate-400" />
                        <span className="font-medium">{t.capacity} orang</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {statusChanging === t.id ? (
                        <Loader2 size={14} className="animate-spin text-blue-500 mx-auto" />
                      ) : (
                        <select
                          value={t.status}
                          onChange={e => handleStatusChange(t.id, e.target.value)}
                          className="text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:border-blue-300 text-slate-600"
                        >
                          <option value="available">Tersedia</option>
                          <option value="occupied">Terisi</option>
                          <option value="reserved">Dipesan</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(t)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteId(t.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-extrabold text-slate-800">{form.id ? 'Edit Meja' : 'Tambah Meja'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nomor Meja</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={form.table_number}
                  onChange={e => setForm(f => ({ ...f, table_number: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
                  placeholder="Contoh: 1, 2, A1, VIP1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Kapasitas (orang)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={50}
                  value={form.capacity}
                  onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 4 }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
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
                  {form.id ? 'Simpan' : 'Tambahkan'}
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
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-50 rounded-xl"><Trash2 size={20} className="text-red-500" /></div>
              <div>
                <h2 className="font-extrabold text-slate-800">Hapus Meja?</h2>
                <p className="text-xs text-slate-400">Meja: {tables.find(t => t.id === deleteId)?.table_number}</p>
              </div>
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
