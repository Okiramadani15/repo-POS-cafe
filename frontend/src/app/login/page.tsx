"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/api/axiosConfig';
import { Coffee, Lock, User, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { username, password });
      
      // Ambil data dari response.data (sesuai struktur authController.js)
      const { token, role, username: loggedInUser } = response.data;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('username', loggedInUser);

        // Beri jeda sedikit agar penyimpanan localStorage selesai sempurna
        setTimeout(() => {
          if (role === 'admin' || role === 'owner') {
            router.replace('/admin/dashboard'); // Gunakan replace agar tidak bisa "back" ke login
          } else {
            router.replace('/pos'); // kasir hanya akses halaman POS
          }
        }, 100);
      }
    } catch (err: any) {
      // Menampilkan pesan spesifik dari backend (misal: "User tidak ditemukan")
      const serverMessage = err.response?.data?.message;
      setError(serverMessage || 'Gagal terhubung ke server. Pastikan Backend nyala.');
      console.error("Login Error Details:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-900">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="p-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full shadow-lg mb-4">
              <Coffee className="text-white w-10 h-10" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Point Of Sale</h2>
            <p className="text-slate-500 mt-2 font-medium">Sistem Manajemen Cafe & Resto</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Login Sekarang'}
            </button>
          </form>
        </div>
        <div className="bg-slate-50/80 py-6 px-8 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
              © 2026 Oki Ramadani <span className="mx-2">•</span> All Rights Reserved
           </p>
        </div>
      </div>
    </div>
  );
}