"use client";
import React, { useEffect, useState } from 'react';
import api from '@/api/axiosConfig';
import { Product, CartItem } from '@/types';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Package, Loader2, X, CheckCircle } from 'lucide-react';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:8080';

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      const actualData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setProducts(actualData);
    } catch {
      console.error('Gagal ambil produk');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Stok habis!');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('Batas stok tercapai');
          return prev;
        }
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const productOrigin = products.find(p => p.id === id);
        const newQty = Math.max(1, item.quantity + delta);
        if (productOrigin && newQty > productOrigin.stock) {
          alert('Stok tidak mencukupi');
          return item;
        }
        return { ...item, quantity: newQty };
      })
    );
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Konfirmasi dulu → kemudian baru bayar
  const handleConfirmPayment = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);
    try {
      await api.post('/orders', {
        items: cart.map(item => ({ product_id: item.id, quantity: item.quantity })),
        total_price: total,
      });
      setShowConfirm(false);
      setCart([]);
      await fetchProducts(); // stok diperbarui setelah pembayaran
    } catch {
      alert('Transaksi gagal! Cek koneksi backend.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row h-screen bg-slate-50 font-sans">
        {/* AREA PRODUK */}
        <div className="flex-1 p-6 overflow-y-auto">
          <header className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Menu POS</h1>
              <p className="text-sm text-slate-400">Pilih produk untuk pesanan</p>
            </div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">© 2026 Oki Ramadani</span>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.isArray(products) && products.length > 0 ? (
              products.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  className={`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-left active:scale-95 ${product.stock <= 0 ? 'opacity-50 grayscale' : ''}`}
                >
                  {/* Gambar Produk */}
                  <div className="w-full h-32 bg-slate-50 rounded-xl mb-3 overflow-hidden flex items-center justify-center text-slate-300">
                    {product.image_url ? (
                      <img
                        src={`${BACKEND_URL}${product.image_url}`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={40} />
                    )}
                  </div>
                  <h3 className="font-bold text-slate-700 truncate">{product.name}</h3>
                  <p className="text-xs text-slate-400 mb-2">{product.category_name || 'General'}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-600 font-bold">Rp {product.price.toLocaleString()}</span>
                    <span className={`text-[10px] px-2 py-1 rounded font-bold ${product.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                      Stok: {product.stock}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-full py-20 text-center text-slate-400">
                Data produk tidak ditemukan.
              </div>
            )}
          </div>
        </div>

        {/* KERANJANG */}
        <div className="w-full lg:w-96 bg-white border-l border-slate-100 flex flex-col shadow-2xl">
          <div className="p-6 border-b border-slate-50 flex items-center gap-2 bg-white sticky top-0 z-10">
            <div className="p-2 bg-blue-50 rounded-lg">
              <ShoppingCart className="text-blue-600" size={20} />
            </div>
            <h2 className="font-bold text-lg text-slate-800">Pesanan Aktif</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2 opacity-60">
                <ShoppingCart size={48} />
                <p className="text-sm font-medium">Keranjang masih kosong</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-700 truncate">{item.name}</h4>
                    <p className="text-xs text-blue-600 font-bold">Rp {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
                    <button onClick={() => updateQuantity(item.id!, -1)} className="p-1 hover:bg-slate-100 rounded text-blue-600"><Minus size={14} /></button>
                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id!, 1)} className="p-1 hover:bg-slate-100 rounded text-blue-600"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => setCart(cart.filter(c => c.id !== item.id))} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
            <div className="flex justify-between text-lg font-extrabold text-slate-800">
              <span>Total</span>
              <span className="text-blue-600">Rp {total.toLocaleString()}</span>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={cart.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
            >
              <CreditCard size={20} />
              Konfirmasi Pembayaran
            </button>
          </div>
        </div>
      </div>

      {/* MODAL KONFIRMASI PEMBAYARAN */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            onClick={() => !checkoutLoading && setShowConfirm(false)}
          />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            {/* Header modal */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Konfirmasi Pembayaran</h3>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={checkoutLoading}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Ringkasan pesanan */}
            <div className="p-5 space-y-2 max-h-64 overflow-y-auto">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Ringkasan Pesanan</p>
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-slate-700 flex-1 truncate">{item.name}</span>
                  <span className="text-slate-400 mx-3">x{item.quantity}</span>
                  <span className="font-semibold text-slate-700">
                    Rp {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="px-5 py-3 bg-blue-50 border-t border-blue-100 flex justify-between items-center">
              <span className="font-bold text-slate-700">Total Pembayaran</span>
              <span className="text-xl font-extrabold text-blue-600">Rp {total.toLocaleString()}</span>
            </div>

            {/* Tombol aksi */}
            <div className="p-5 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={checkoutLoading}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={checkoutLoading}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all"
              >
                {checkoutLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Bayar Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
