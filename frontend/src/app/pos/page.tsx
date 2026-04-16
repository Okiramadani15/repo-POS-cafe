"use client";
import React, { useEffect, useState } from 'react';
import api from '@/api/axiosConfig';
import { Product, CartItem } from '@/types';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from 'lucide-react';

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error("Gagal ambil produk");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      // Sesuai dengan API yang kamu buat di backend
      await api.post('/transactions', {
        items: cart.map(item => ({ product_id: item.id, quantity: item.quantity })),
        total_price: total
      });
      alert("Transaksi Berhasil!");
      setCart([]);
      fetchProducts(); // Refresh stok
    } catch (err) {
      alert("Transaksi Gagal!");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50">
      {/* AREA PRODUK (Kiri) */}
      <div className="flex-1 p-6 overflow-y-auto">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Menu POS</h1>
          <span className="text-sm font-light text-slate-400">© 2026 Oki Ramadani</span>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-left active:scale-95"
            >
              <div className="w-full h-32 bg-slate-50 rounded-xl mb-3 flex items-center justify-center text-slate-300">
                <Package size={40} />
              </div>
              <h3 className="font-bold text-slate-700 truncate">{product.name}</h3>
              <p className="text-xs text-slate-400 mb-2">{product.category}</p>
              <div className="flex justify-between items-center">
                <span className="text-blue-600 font-bold">Rp {product.price.toLocaleString()}</span>
                <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">Stok: {product.stock}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* KERANJANG (Kanan) */}
      <div className="w-full lg:w-96 bg-white border-l border-slate-100 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-50 flex items-center gap-2">
          <ShoppingCart className="text-blue-600" />
          <h2 className="font-bold text-lg">Pesanan Aktif</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-700">{item.name}</h4>
                <p className="text-xs text-blue-600 font-semibold">Rp {(item.price * item.quantity).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
                <button onClick={() => updateQuantity(item.id!, -1)} className="p-1 hover:bg-slate-100 rounded text-blue-600"><Minus size={14}/></button>
                <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id!, 1)} className="p-1 hover:bg-slate-100 rounded text-blue-600"><Plus size={14}/></button>
              </div>
              <button onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-blue-600">Rp {total.toLocaleString()}</span>
          </div>
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <CreditCard size={20} />
            Konfirmasi Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
}