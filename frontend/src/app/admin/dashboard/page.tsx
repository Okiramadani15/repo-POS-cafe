"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [username, setUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    setUsername(localStorage.getItem('username') || '');
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
            <p className="text-slate-500">Selamat datang, {username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
          >
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm font-medium">Total Produk</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">-</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm font-medium">Total Order</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">-</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm font-medium">Total Meja</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">-</p>
          </div>
        </div>
      </div>
    </div>
  );
}