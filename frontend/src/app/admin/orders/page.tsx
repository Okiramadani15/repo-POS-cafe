"use client";
import { useEffect, useState, useCallback } from 'react';
import api from '@/api/axiosConfig';
import {
  ClipboardList, Search, Trash2, Eye, X, Loader2,
  ShoppingBag, CalendarDays, RefreshCw, Package
} from 'lucide-react';

interface Order {
  id: number;
  order_no: string;
  total_amount: number;
  status: string;
  created_at: string;
  kasir: string;
  meja: string | null;
  payment_method: string;
  payment_amount: number;
  change_amount: number;
  notes: string | null;
}

interface OrderItem {
  product_name: string;
  quantity: number;
  price_at_time: number;
  image_url: string | null;
}

interface OrderDetail extends Order {
  items: OrderItem[];
}

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer',
  dana: 'DANA', ovo: 'OVO', gopay: 'GoPay',
};

const PAYMENT_COLOR: Record<string, string> = {
  cash: 'bg-emerald-50 text-emerald-700',
  qris: 'bg-blue-50 text-blue-700',
  transfer: 'bg-violet-50 text-violet-700',
  dana: 'bg-sky-50 text-sky-700',
  ovo: 'bg-purple-50 text-purple-700',
  gopay: 'bg-teal-50 text-teal-700',
};

const formatRp = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080';

const STATUS_STYLE: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-600',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await api.get('/orders', { params });
      setOrders(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, dateFrom, dateTo]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await api.get(`/orders/${id}`);
      setDetail(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/orders/${deleteId}`);
      setOrders(prev => prev.filter(o => o.id !== deleteId));
      showToast('Order berhasil dihapus');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Gagal menghapus order');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-800 text-white text-sm px-4 py-3 rounded-xl shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Transaksi</h1>
          <p className="text-sm text-slate-500 font-light">Riwayat semua transaksi penjualan.</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-violet-50 rounded-xl"><ClipboardList size={18} className="text-violet-600" /></div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Transaksi</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{orders.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 rounded-xl"><ShoppingBag size={18} className="text-emerald-600" /></div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Pendapatan</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-800">{formatRp(totalRevenue)}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari no. order atau kasir…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays size={15} className="text-slate-400 flex-shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-300"
            />
            <span className="text-slate-400 text-sm">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-300"
            />
          </div>
          {(search || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }}
              className="px-3 py-2.5 text-xs text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3 text-slate-300">
            <ClipboardList size={40} />
            <p className="text-sm">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-slate-600">No. Order</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Kasir</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Meja</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Bayar</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-600">Total</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Waktu</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-bold text-slate-700">{o.order_no}</td>
                    <td className="px-4 py-3 text-slate-500">{o.kasir ?? '-'}</td>
                    <td className="px-4 py-3 text-slate-500">{o.meja ? `Meja ${o.meja}` : '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${PAYMENT_COLOR[o.payment_method] ?? 'bg-slate-100 text-slate-500'}`}>
                        {PAYMENT_LABEL[o.payment_method] ?? o.payment_method ?? '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatRp(Number(o.total_amount))}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[o.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(o.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openDetail(o.id)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                          title="Lihat detail"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteId(o.id)}
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
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white">
              <div>
                <h2 className="font-extrabold text-slate-800">Detail Order</h2>
                {detail && <p className="text-xs text-slate-400 mt-0.5">{detail.order_no}</p>}
              </div>
              <button onClick={() => setDetail(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            {detailLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
            ) : detail ? (
              <div className="p-6 space-y-5">
                {/* Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Kasir</p>
                    <p className="font-bold text-slate-700">{detail.kasir ?? '-'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Meja</p>
                    <p className="font-bold text-slate-700">{detail.meja ? `Meja ${detail.meja}` : 'Takeaway'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Status</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[detail.status] ?? 'bg-slate-100 text-slate-500'}`}>
                      {detail.status}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Waktu</p>
                    <p className="font-bold text-slate-700 text-xs">{formatDate(detail.created_at)}</p>
                  </div>
                </div>
                {/* Items */}
                <div>
                  <h3 className="font-bold text-slate-700 text-sm mb-3">Item Pesanan</h3>
                  <div className="space-y-2">
                    {detail.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="w-9 h-9 rounded-lg bg-white border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {item.image_url
                            ? <img src={`${API_BASE}${item.image_url}`} alt={item.product_name} className="w-full h-full object-cover" />
                            : <Package size={14} className="text-slate-300" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-700 truncate">{item.product_name}</p>
                          <p className="text-xs text-slate-400">{item.quantity} × {formatRp(Number(item.price_at_time))}</p>
                        </div>
                        <span className="text-sm font-bold text-emerald-600 flex-shrink-0">
                          {formatRp(item.quantity * Number(item.price_at_time))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Payment info */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Metode Bayar</span>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${PAYMENT_COLOR[detail.payment_method] ?? 'bg-slate-100 text-slate-500'}`}>
                      {PAYMENT_LABEL[detail.payment_method] ?? detail.payment_method ?? '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                    <span className="font-bold text-slate-700">Total</span>
                    <span className="text-base font-extrabold text-emerald-600">{formatRp(Number(detail.total_amount))}</span>
                  </div>
                  {detail.payment_method === 'cash' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Dibayar</span>
                        <span className="font-semibold text-slate-700">{formatRp(Number(detail.payment_amount))}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Kembalian</span>
                        <span className="font-semibold text-blue-600">{formatRp(Number(detail.change_amount))}</span>
                      </div>
                    </>
                  )}
                  {detail.notes && (
                    <div className="border-t border-slate-200 pt-2">
                      <span className="text-slate-500 block text-xs mb-1">Catatan</span>
                      <p className="text-slate-700 text-sm">{detail.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
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
                <h2 className="font-extrabold text-slate-800">Hapus Order?</h2>
                <p className="text-xs text-slate-400">Tindakan ini tidak bisa dibatalkan.</p>
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
