"use client";
import { useState } from 'react';
import api from '@/api/axiosConfig';

export default function RegisterUserPage() {
  const [formData, setFormData] = useState({ username: '', password: '', role: 'kasir' });
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', formData);
      setMsg('User berhasil dibuat!');
      setFormData({ username: '', password: '', role: 'kasir' });
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Gagal registrasi');
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto bg-white shadow-xl rounded-2xl mt-10">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Tambah Staff Baru</h1>
      {msg && <p className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg">{msg}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full p-3 border rounded-xl"
          placeholder="Username"
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          value={formData.username}
        />
        <input
          type="password"
          className="w-full p-3 border rounded-xl"
          placeholder="Password"
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          value={formData.password}
        />
        <select
          className="w-full p-3 border rounded-xl"
          value={formData.role}
          onChange={(e) => setFormData({...formData, role: e.target.value})}
        >
          <option value="kasir">Kasir</option>
          <option value="admin">Admin</option>
          <option value="owner">Owner</option>
        </select>
        <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">
          Daftarkan User
        </button>
      </form>
    </div>
  );
}