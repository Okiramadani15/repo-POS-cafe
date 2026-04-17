"use client";
import React, { useEffect, useState, useMemo } from 'react';
import api from '@/api/axiosConfig';
import Image from 'next/image';
import {
  ShoppingCart, Plus, Minus, Trash2, Package, Loader2, X,
  CheckCircle, Banknote, QrCode, CreditCard, Smartphone,
  LayoutGrid, Search, ChevronDown, Receipt, Coffee
} from 'lucide-react';
import { useAppSettings, BACKEND_URL as SETTINGS_BACKEND_URL } from '@/hooks/useAppSettings';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category_id: number | null;
  category_name: string;
  image_url: string | null;
}
interface CartItem extends Product { quantity: number; }
interface TableItem {
  id: number;
  table_number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
}
interface Category { id: number; name: string; }

type PaymentMethod = 'cash' | 'qris' | 'transfer' | 'dana' | 'ovo' | 'gopay';

const BACKEND_URL = SETTINGS_BACKEND_URL;

const formatRp = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

// ─── Payment method config ────────────────────────────────────────────────────
const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'cash',     label: 'Tunai',    icon: <Banknote size={18} />,   color: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
  { key: 'qris',     label: 'QRIS',     icon: <QrCode size={18} />,      color: 'bg-blue-50    border-blue-300    text-blue-700'    },
  { key: 'transfer', label: 'Transfer', icon: <CreditCard size={18} />,  color: 'bg-violet-50  border-violet-300  text-violet-700'  },
  { key: 'dana',     label: 'DANA',     icon: <Smartphone size={18} />,  color: 'bg-sky-50     border-sky-300     text-sky-700'     },
  { key: 'ovo',      label: 'OVO',      icon: <Smartphone size={18} />,  color: 'bg-purple-50  border-purple-300  text-purple-700'  },
  { key: 'gopay',    label: 'GoPay',    icon: <Smartphone size={18} />,  color: 'bg-teal-50    border-teal-300    text-teal-700'    },
];

// Quick-nominal for cash input
const QUICK_NOMINALS = [5000, 10000, 20000, 50000, 100000, 50000];

export default function POSPage() {
  const [products, setProducts]         = useState<Product[]>([]);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [tables, setTables]             = useState<TableItem[]>([]);
  const [cart, setCart]                 = useState<CartItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [activeCat, setActiveCat]       = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidInput, setPaidInput]       = useState('');
  const [notes, setNotes]               = useState('');
  const [discount, setDiscount]         = useState('');
  const [successData, setSuccessData]   = useState<any>(null);
  const [kasirName, setKasirName]       = useState('');
  const { settings }                    = useAppSettings();

  useEffect(() => {
    setKasirName(localStorage.getItem('username') || '');
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, tableRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/tables'),
      ]);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data.data ?? []));
      const cats = catRes.data.data ?? catRes.data;
      setCategories(Array.isArray(cats) ? cats : []);
      const tbls = tableRes.data.data ?? tableRes.data;
      setTables(Array.isArray(tbls) ? tbls : []);
    } catch { /* handled by axiosConfig */ }
    finally { setLoading(false); }
  };

  // ─── Cart logic ───────────────────────────────────────────────────────────
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // already at max
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.flatMap(item => {
      if (item.id !== id) return [item];
      const newQty = item.quantity + delta;
      if (newQty <= 0) return [];
      const prod = products.find(p => p.id === id);
      if (prod && newQty > prod.stock) return [item];
      return [{ ...item, quantity: newQty }];
    }));
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => { setCart([]); setSelectedTable(null); setNotes(''); setDiscount(''); setPaidInput(''); };

  // ─── Computed values ─────────────────────────────────────────────────────
  const subtotal      = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmt   = Math.min(parseFloat(discount) || 0, subtotal);
  const grandTotal    = subtotal - discountAmt;
  const paidAmount    = parseFloat(paidInput) || 0;
  const change        = paymentMethod === 'cash' ? Math.max(paidAmount - grandTotal, 0) : 0;
  const isPaidEnough  = paymentMethod !== 'cash' || paidAmount >= grandTotal;

  // Quick nominal: round up to nearest sensible amount
  const quickNominals = useMemo(() => {
    if (grandTotal <= 0) return QUICK_NOMINALS;
    const base = [grandTotal, ...QUICK_NOMINALS.map(n => Math.ceil(grandTotal / n) * n)];
    return [...new Set(base)].sort((a, b) => a - b).slice(0, 6);
  }, [grandTotal]);

  // ─── Filtered products ────────────────────────────────────────────────────
  const filtered = useMemo(() => products.filter(p => {
    const matchCat = activeCat === null || p.category_id === activeCat;
    const matchSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }), [products, activeCat, search]);

  // ─── Checkout ─────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (cart.length === 0 || !isPaidEnough) return;
    setCheckoutLoading(true);
    try {
      const res = await api.post('/orders', {
        items: cart.map(i => ({ product_id: i.id, quantity: i.quantity })),
        table_id: selectedTable || null,
        payment_method: paymentMethod,
        payment_amount: paymentMethod === 'cash' ? paidAmount : grandTotal,
        notes: notes || null,
        discount: discountAmt,
      });
      setSuccessData({ ...res.data.data, kembalian: res.data.data.kembalian ?? change });
      setShowConfirm(false);
      clearCart();
      await fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Transaksi gagal!');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const openPayment = () => {
    if (cart.length === 0) return;
    setPaidInput('');
    setShowConfirm(true);
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
      <div className="flex flex-col lg:flex-row h-screen bg-slate-50 font-sans overflow-hidden">

        {/* ═══ AREA PRODUK ════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar */}
          <header className="bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              {settings.logo_url ? (
                <Image
                  src={BACKEND_URL + settings.logo_url}
                  alt="Logo"
                  width={28}
                  height={28}
                  className="rounded-lg object-contain"
                />
              ) : (
                <div className="p-1.5 bg-blue-600 rounded-lg"><Coffee size={16} className="text-white" /></div>
              )}
              <span className="font-extrabold text-slate-800 text-sm">{settings.store_name}</span>
            </div>
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari produk…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-300"
              />
            </div>
            <span className="text-xs text-slate-400 font-medium hidden sm:block">Kasir: <strong className="text-slate-600">{kasirName}</strong></span>
          </header>

          {/* Category tabs */}
          <div className="bg-white border-b border-slate-100 px-5 py-2.5 flex gap-2 overflow-x-auto flex-shrink-0">
            <button
              onClick={() => setActiveCat(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeCat === null ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Semua
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeCat === c.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3">
                <Package size={48} /><p className="text-sm">Produk tidak ditemukan</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filtered.map(product => {
                  const inCart = cart.find(i => i.id === product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={product.stock <= 0}
                      className={`bg-white p-3 rounded-2xl border text-left transition-all active:scale-95 relative
                        ${product.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed border-slate-100' : 'border-slate-100 hover:border-blue-200 hover:shadow-md shadow-sm'}
                        ${inCart ? 'ring-2 ring-blue-400 border-blue-200' : ''}
                      `}
                    >
                      {inCart && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center z-10">
                          {inCart.quantity}
                        </div>
                      )}
                      <div className="w-full h-28 bg-slate-50 rounded-xl mb-2.5 overflow-hidden flex items-center justify-center text-slate-200">
                        {product.image_url
                          ? <img src={`${BACKEND_URL}${product.image_url}`} alt={product.name} className="w-full h-full object-cover" />
                          : <Package size={32} />
                        }
                      </div>
                      <h3 className="font-bold text-slate-700 text-sm truncate">{product.name}</h3>
                      <p className="text-[10px] text-slate-400 mb-1.5">{product.category_name || '—'}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-600 font-extrabold text-sm">{formatRp(product.price)}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold
                          ${product.stock === 0 ? 'bg-red-100 text-red-600' : product.stock < 5 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                          {product.stock === 0 ? 'Habis' : `Stok ${product.stock}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ═══ PANEL KERANJANG ════════════════════════════════════════════════ */}
        <div className="w-full lg:w-[360px] bg-white border-l border-slate-100 flex flex-col shadow-2xl flex-shrink-0">
          {/* Cart header */}
          <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg"><ShoppingCart className="text-blue-600" size={18} /></div>
              <span className="font-bold text-slate-800">Pesanan</span>
              {cart.length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{cart.length}</span>
              )}
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-slate-400 hover:text-red-500 transition-colors font-medium">Kosongkan</button>
            )}
          </div>

          {/* Table selector */}
          <div className="px-4 py-3 border-b border-slate-50">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
              <LayoutGrid size={12} /> Pilih Meja (opsional)
            </label>
            <div className="relative">
              <select
                value={selectedTable ?? ''}
                onChange={e => setSelectedTable(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-300 text-slate-700 font-medium"
              >
                <option value="">— Takeaway / Tanpa Meja —</option>
                {tables.filter(t => t.status !== 'reserved').map(t => (
                  <option key={t.id} value={t.id} disabled={t.status === 'occupied'}>
                    Meja {t.table_number} ({t.capacity} orang){t.status === 'occupied' ? ' — Terisi' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-200 gap-2 opacity-80">
                <ShoppingCart size={40} />
                <p className="text-xs font-medium">Keranjang kosong</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-700 truncate">{item.name}</h4>
                    <p className="text-[11px] text-blue-600 font-bold">{formatRp(item.price * item.quantity)}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-1">
                    <button onClick={() => updateQty(item.id, -1)} className="p-0.5 hover:bg-slate-100 rounded text-blue-600"><Minus size={12} /></button>
                    <span className="text-xs font-extrabold w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="p-0.5 hover:bg-slate-100 rounded text-blue-600"><Plus size={12} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-400 transition-colors p-1"><Trash2 size={14} /></button>
                </div>
              ))
            )}
          </div>

          {/* Notes & discount */}
          {cart.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-50 space-y-2">
              <input
                type="text"
                placeholder="Catatan pesanan…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-300"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 font-medium whitespace-nowrap">Diskon (Rp)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-300"
                />
              </div>
            </div>
          )}

          {/* Total & checkout */}
          <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span><span>{formatRp(subtotal)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon</span><span>- {formatRp(discountAmt)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-slate-800 text-base pt-1 border-t border-slate-200">
                <span>Total</span><span className="text-blue-600">{formatRp(grandTotal)}</span>
              </div>
            </div>
            <button
              onClick={openPayment}
              disabled={cart.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-blue-100"
            >
              <Receipt size={18} /> Bayar
            </button>
          </div>
        </div>
      </div>

      {/* ═══ MODAL PEMBAYARAN ════════════════════════════════════════════════ */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !checkoutLoading && setShowConfirm(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <h3 className="font-extrabold text-lg text-slate-800">Konfirmasi Pembayaran</h3>
              <button onClick={() => setShowConfirm(false)} disabled={checkoutLoading} className="p-1.5 hover:bg-slate-100 rounded-xl">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {/* Order summary */}
              <div className="p-5 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Ringkasan Pesanan</p>
                <div className="space-y-1.5">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span className="text-slate-700 flex-1 truncate">{item.name}</span>
                      <span className="text-slate-400 mx-2 text-xs">×{item.quantity}</span>
                      <span className="font-semibold text-slate-700">{formatRp(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                {selectedTable && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                    <LayoutGrid size={12} /> Meja {tables.find(t => t.id === selectedTable)?.table_number}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="px-5 py-3 border-b border-slate-100 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatRp(subtotal)}</span></div>
                {discountAmt > 0 && <div className="flex justify-between text-emerald-600"><span>Diskon</span><span>- {formatRp(discountAmt)}</span></div>}
                <div className="flex justify-between font-extrabold text-base text-slate-800 pt-1">
                  <span>Total</span><span className="text-blue-600">{formatRp(grandTotal)}</span>
                </div>
              </div>

              {/* Payment method selection */}
              <div className="p-5 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Metode Pembayaran</p>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map(pm => (
                    <button
                      key={pm.key}
                      onClick={() => { setPaymentMethod(pm.key); setPaidInput(''); }}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 text-xs font-bold transition-all
                        ${paymentMethod === pm.key ? pm.color + ' scale-105' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                    >
                      {pm.icon}
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash input */}
              {paymentMethod === 'cash' && (
                <div className="p-5 border-b border-slate-100 space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jumlah Uang Diterima</p>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">Rp</span>
                    <input
                      type="number"
                      min={grandTotal}
                      value={paidInput}
                      onChange={e => setPaidInput(e.target.value)}
                      placeholder={String(grandTotal)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  {/* Quick nominals */}
                  <div className="flex flex-wrap gap-2">
                    {quickNominals.map((n, i) => (
                      <button
                        key={i}
                        onClick={() => setPaidInput(String(n))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                          ${paidInput === String(n) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                      >
                        {formatRp(n)}
                      </button>
                    ))}
                  </div>
                  {paidInput && paidAmount >= grandTotal && (
                    <div className="flex justify-between items-center bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-200">
                      <span className="text-sm font-bold text-emerald-700">Kembalian</span>
                      <span className="text-lg font-extrabold text-emerald-700">{formatRp(change)}</span>
                    </div>
                  )}
                  {paidInput && paidAmount < grandTotal && (
                    <div className="flex justify-between items-center bg-red-50 rounded-xl px-4 py-3 border border-red-200">
                      <span className="text-sm font-bold text-red-600">Kurang</span>
                      <span className="text-lg font-extrabold text-red-600">{formatRp(grandTotal - paidAmount)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* QRIS info */}
              {paymentMethod === 'qris' && (
                <div className="p-5 border-b border-slate-100 text-center space-y-3">
                  <div className="w-32 h-32 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300">
                    <QrCode size={56} className="text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">Scan QR untuk membayar</p>
                  <p className="text-lg font-extrabold text-blue-600">{formatRp(grandTotal)}</p>
                  <p className="text-xs text-slate-400">QR akan terintegrasi dengan Xendit/Midtrans</p>
                </div>
              )}

              {/* Transfer info */}
              {paymentMethod === 'transfer' && (
                <div className="p-5 border-b border-slate-100 space-y-3">
                  <div className="bg-violet-50 rounded-xl p-4 border border-violet-200 space-y-2">
                    <p className="text-xs font-bold text-violet-700 uppercase tracking-wide">Info Rekening</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Bank</span>
                      <span className="font-bold text-slate-800">BCA / BRI / Mandiri</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Nomor Rekening</span>
                      <span className="font-bold text-slate-800">— Belum Dikonfigurasi —</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Jumlah Transfer</span>
                      <span className="font-extrabold text-blue-600">{formatRp(grandTotal)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 text-center">Konfigurasikan di Pengaturan → Info Toko</p>
                </div>
              )}

              {/* E-wallet info */}
              {['dana', 'ovo', 'gopay'].includes(paymentMethod) && (
                <div className="p-5 border-b border-slate-100 space-y-3">
                  <div className="bg-sky-50 rounded-xl p-4 border border-sky-200 space-y-2">
                    <p className="text-xs font-bold text-sky-700 uppercase tracking-wide">
                      {paymentMethod.toUpperCase()} — Nomor Tujuan
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Nomor</span>
                      <span className="font-bold text-slate-800">— Belum Dikonfigurasi —</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Jumlah</span>
                      <span className="font-extrabold text-blue-600">{formatRp(grandTotal)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 text-center">Konfigurasikan di Pengaturan → Info Toko</p>
                </div>
              )}
            </div>

            {/* Confirm button */}
            <div className="p-5 flex gap-3 flex-shrink-0 border-t border-slate-100 bg-white">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={checkoutLoading}
                className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleCheckout}
                disabled={checkoutLoading || !isPaidEnough}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {checkoutLoading ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle size={18} /> Bayar Sekarang</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL SUKSES / STRUK ════════════════════════════════════════════ */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-emerald-600" size={32} />
              </div>
              <h3 className="font-extrabold text-xl text-slate-800 mb-1">Pembayaran Berhasil!</h3>
              <p className="text-sm text-slate-400">{successData.order_no}</p>
            </div>
            <div className="border-t border-dashed border-slate-200 mx-6" />
            <div className="px-6 py-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600"><span>Total</span><span className="font-bold">{formatRp(Number(successData.total_amount))}</span></div>
              <div className="flex justify-between text-slate-600"><span>Metode</span><span className="font-bold capitalize">{successData.payment_method}</span></div>
              {successData.payment_method === 'cash' && (
                <>
                  <div className="flex justify-between text-slate-600"><span>Dibayar</span><span className="font-bold">{formatRp(Number(successData.payment_amount))}</span></div>
                  <div className="flex justify-between text-emerald-700 font-extrabold"><span>Kembalian</span><span>{formatRp(Number(successData.kembalian ?? 0))}</span></div>
                </>
              )}
            </div>
            <div className="p-5">
              <button
                onClick={() => setSuccessData(null)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all"
              >
                Pesanan Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
