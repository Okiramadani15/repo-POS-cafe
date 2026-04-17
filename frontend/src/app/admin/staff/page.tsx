"use client";
import { useEffect, useState, useCallback } from 'react';
import api from '@/api/axiosConfig';
import {
  Users, Plus, Pencil, Trash2, X, Loader2,
  ShieldCheck, Coffee, UserCog
} from 'lucide-react';

interface StaffUser {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

interface FormState {
  id?: number;
  username: string;
  password: string;
  role: string;
}

const emptyForm = (): FormState => ({ username: '', password: '', role: 'kasir' });

const ROLE_STYLE: Record<string, string> = {
  owner: 'bg-violet-50 text-violet-700',
  admin: 'bg-blue-50 text-blue-700',
  kasir: 'bg-slate-100 text-slate-600',
};

const ROLE_ICON: Record<string, React.ReactNode> = {
  owner: <ShieldCheck size={12} />,
  admin: <UserCog size={12} />,
  kasir: <Coffee size={12} />,
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setStaff(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const openAdd = () => {
    setForm(emptyForm());
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = (u: StaffUser) => {
    setForm({ id: u.id, username: u.username, password: '', role: u.role });
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (form.id) {
        // Edit — password opsional
        await api.put(`/users/${form.id}`, {
          username: form.username,
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        });
        showToast('Karyawan berhasil diupdate');
      } else {
        // Tambah baru via auth/register
        await api.post('/auth/register', {
          username: form.username,
          password: form.password,
          role: form.role,
        });
        showToast('Karyawan berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteId}`);
      setStaff(prev => prev.filter(u => u.id !== deleteId));
      showToast('Karyawan berhasil dihapus');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Gagal menghapus karyawan');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const countByRole = (role: string) => staff.filter(u => u.role === role).length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-800 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Karyawan</h1>
          <p className="text-sm text-slate-500 font-light">Kelola akun staff dan hak akses.</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-100 active:scale-95"
        >
          <Plus size={18} />
          Tambah Karyawan
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {(['owner', 'admin', 'kasir'] as const).map(role => (
          <div key={role} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${ROLE_STYLE[role]}`}>{ROLE_ICON[role]}</div>
              <span className="text-xs font-semibold text-slate-500 capitalize">{role}</span>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{countByRole(role)}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3 text-slate-300">
            <Users size={40} />
            <p className="text-sm">Belum ada karyawan</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Username</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Bergabung</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {staff.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-xs flex-shrink-0">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-700">{u.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${ROLE_STYLE[u.role] ?? 'bg-slate-100 text-slate-600'}`}>
                      {ROLE_ICON[u.role]}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteId(u.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                        title="Hapus"
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-extrabold text-slate-800">
                {form.id ? 'Edit Karyawan' : 'Tambah Karyawan'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
                  placeholder="Contoh: budi_kasir"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password {form.id && <span className="text-slate-400 font-normal">(kosongkan jika tidak diubah)</span>}
                </label>
                <input
                  type="password"
                  required={!form.id}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
                  placeholder={form.id ? '••••••' : 'Min. 6 karakter'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
                >
                  <option value="kasir">Kasir</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                  {form.id ? 'Simpan Perubahan' : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-50 rounded-xl"><Trash2 size={20} className="text-red-500" /></div>
              <div>
                <h2 className="font-extrabold text-slate-800">Hapus Karyawan?</h2>
                <p className="text-xs text-slate-400">Akun ini akan dihapus permanen.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
