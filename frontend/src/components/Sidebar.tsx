"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart,
  Users, Settings, LogOut, Coffee, Menu, X,
  LayoutGrid, Tag
} from 'lucide-react';
import { useAppSettings, BACKEND_URL } from '@/hooks/useAppSettings';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useAppSettings();

  const menuItems = [
    { name: 'Dashboard',  icon: <LayoutDashboard size={20} />, path: '/admin/dashboard' },
    { name: 'Produk/Menu',icon: <Package size={20} />,         path: '/admin/products'  },
    { name: 'Kategori',   icon: <Tag size={20} />,             path: '/admin/categories'},
    { name: 'Meja',       icon: <LayoutGrid size={20} />,      path: '/admin/tables'    },
    { name: 'Transaksi',  icon: <ShoppingCart size={20} />,    path: '/admin/orders'    },
    { name: 'Karyawan',   icon: <Users size={20} />,           path: '/admin/staff'     },
    { name: 'Pengaturan', icon: <Settings size={20} />,        path: '/admin/settings'  },
  ];

  return (
    <>
      {/* Tombol Hamburger untuk Mobile */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay untuk Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed left-0 top-0 h-screen bg-white border-r border-slate-200 flex flex-col z-40 transition-transform duration-300
        w-64 lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-50">
          {settings.logo_url ? (
            <Image
              src={BACKEND_URL + settings.logo_url}
              alt="Logo"
              width={40}
              height={40}
              className="rounded-lg object-contain"
            />
          ) : (
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Coffee size={24} />
            </div>
          )}
          <span className="font-bold text-xl text-slate-800 tracking-tight">
            {settings.store_name}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                onClick={() => setIsOpen(false)} // Tutup sidebar saat link diklik (mobile)
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive 
                  ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-50">
          <button 
            onClick={() => { localStorage.clear(); router.push('/login'); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 transition-all mb-4"
          >
            <LogOut size={20} />
            Keluar
          </button>
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-light uppercase tracking-[0.2em] opacity-80">
              © 2026 Oki Ramadani
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;