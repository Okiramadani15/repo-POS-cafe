"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/api/axiosConfig';
import {
  ShoppingBag, ClipboardList, LayoutGrid, Wallet,
  TrendingUp, Users, LogOut, RefreshCw, Package,
  ArrowUpRight, Coffee, Star
} from 'lucide-react';

interface Summary {
  total_products: number;
  total_orders: number;
  total_tables: number;
  total_revenue: number;
  today_orders: number;
  today_revenue: number;
}
interface ChartDay { label: string; revenue: number; orders: number; }
interface TopProduct { name: string; image_url: string | null; total_terjual: number; total_revenue: number; }
interface RecentOrder { order_no: string; total_amount: number; status: string; created_at: string; kasir: string; meja: string | null; }
interface CashierStat { username: string; total_transaksi: number; total_pendapatan: number; }

const formatRp = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

function RevenueChart({ data }: { data: ChartDay[] }) {
  const max = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="flex items-end gap-2 h-28 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="relative w-full flex flex-col justify-end" style={{ height: '80px' }}>
            <div
              className="w-full rounded-t-lg bg-blue-500 group-hover:bg-blue-400 transition-all duration-300 relative"
              style={{ height: `${Math.max((d.revenue / max) * 80, 4)}px` }}
            >
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                {formatRp(d.revenue)}
              </div>
            </div>
          </div>
          <span className="text-[9px] text-slate-400 font-medium">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
        <ArrowUpRight size={14} className="text-slate-300" />
      </div>
      <p className="text-2xl font-extrabold text-slate-800 leading-none">{value}</p>
      <p className="text-xs font-semibold text-slate-500 mt-1">{label}</p>
      {sub && <p className="text-[11px] text-emerald-600 font-medium mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chart, setChart] = useState<ChartDay[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [cashiers, setCashiers] = useState<CashierStat[]>([]);
  const [cashierPeriod, setCashierPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8080';

  const fetchAll = useCallback(async () => {
    try {
      const [summaryRes, chartRes, topRes, recentRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/revenue-chart'),
        api.get('/dashboard/top-products'),
        api.get('/dashboard/recent-orders'),
      ]);
      setSummary(summaryRes.data.data);
      setChart(chartRes.data.data);
      setTopProducts(topRes.data.data);
      setRecentOrders(recentRes.data.data);
    } catch (err) {
      console.error('[Dashboard] Fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchCashiers = useCallback(async () => {
    try {
      const res = await api.get(`/dashboard/cashier-stats?period=${cashierPeriod}`);
      setCashiers(res.data.data);
    } catch (err) {
      console.error('[Dashboard] Cashier fetch error:', err);
    }
  }, [cashierPeriod]);

  useEffect(() => {
    setUsername(localStorage.getItem('username') || '');
    setRole(localStorage.getItem('role') || '');
    fetchAll();
  }, [fetchAll]);

  useEffect(() => { fetchCashiers(); }, [fetchCashiers]);

  const handleRefresh = () => { setRefreshing(true); fetchAll(); fetchCashiers(); };
  const handleLogout = () => { localStorage.clear(); router.replace('/login'); };

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <Coffee className="animate-pulse text-blue-500" size={36} />
          <p className="text-slate-500 text-sm font-medium">Memuat dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Topbar row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">{greeting}, {username}! 👋</h1>
          <p className="text-slate-500 text-sm mt-1">
            {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold uppercase">{role}</span>
          <button onClick={handleRefresh} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500" title="Refresh data">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard icon={<ShoppingBag size={18} className="text-blue-600" />} label="Total Produk" value={String(summary?.total_products ?? 0)} color="bg-blue-50" />
          <StatCard icon={<ClipboardList size={18} className="text-violet-600" />} label="Total Order" value={String(summary?.total_orders ?? 0)} color="bg-violet-50" />
          <StatCard icon={<LayoutGrid size={18} className="text-amber-600" />} label="Total Meja" value={String(summary?.total_tables ?? 0)} color="bg-amber-50" />
          <StatCard icon={<Wallet size={18} className="text-emerald-600" />} label="Total Pendapatan" value={formatRp(summary?.total_revenue ?? 0)} color="bg-emerald-50" />
          <StatCard icon={<TrendingUp size={18} className="text-rose-600" />} label="Order Hari Ini" value={String(summary?.today_orders ?? 0)} sub="Hari ini" color="bg-rose-50" />
          <StatCard icon={<Wallet size={18} className="text-cyan-600" />} label="Pendapatan Hari Ini" value={formatRp(summary?.today_revenue ?? 0)} sub="Hari ini" color="bg-cyan-50" />
        </div>

        {/* Row 2: Chart + Top Produk */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-extrabold text-slate-800">Pendapatan 7 Hari</h2>
                <p className="text-xs text-slate-400 mt-0.5">Revenue harian dalam seminggu terakhir</p>
              </div>
              <TrendingUp size={18} className="text-blue-400" />
            </div>
            {chart.length > 0
              ? <RevenueChart data={chart} />
              : <div className="h-28 flex items-center justify-center text-slate-300 text-sm">Belum ada data</div>
            }
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Star size={16} className="text-amber-500" />
              <h2 className="font-extrabold text-slate-800">Produk Terlaris</h2>
            </div>
            <div className="space-y-3">
              {topProducts.length > 0 ? topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-slate-300 w-4">#{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {p.image_url
                      ? <img src={`${API_BASE}${p.image_url}`} alt={p.name} className="w-full h-full object-cover" />
                      : <Package size={14} className="text-slate-300" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400">{p.total_terjual} terjual</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 flex-shrink-0">{formatRp(p.total_revenue)}</span>
                </div>
              )) : (
                <p className="text-sm text-slate-300 text-center py-6">Belum ada data</p>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Order Terbaru + Performa Kasir */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <ClipboardList size={16} className="text-violet-500" />
              <h2 className="font-extrabold text-slate-800">Order Terbaru</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    <th className="pb-3 text-left font-bold">No. Order</th>
                    <th className="pb-3 text-left font-bold">Kasir</th>
                    <th className="pb-3 text-left font-bold">Meja</th>
                    <th className="pb-3 text-right font-bold">Total</th>
                    <th className="pb-3 text-left font-bold pl-4">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentOrders.length > 0 ? recentOrders.map((o, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 font-bold text-slate-700 text-xs">{o.order_no}</td>
                      <td className="py-3 text-slate-500 text-xs">{o.kasir ?? '-'}</td>
                      <td className="py-3 text-slate-500 text-xs">{o.meja ? `Meja ${o.meja}` : '-'}</td>
                      <td className="py-3 text-right font-bold text-emerald-600 text-xs">{formatRp(o.total_amount)}</td>
                      <td className="py-3 text-slate-400 text-[10px] pl-4">{formatTime(o.created_at)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-300 text-sm">Belum ada order</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-blue-500" />
                <h2 className="font-extrabold text-slate-800">Performa Kasir</h2>
              </div>
              <select
                value={cashierPeriod}
                onChange={e => setCashierPeriod(e.target.value)}
                className="text-[10px] font-bold border border-slate-200 rounded-lg px-2 py-1 text-slate-600 bg-white outline-none focus:border-blue-300"
              >
                <option value="today">Hari Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="year">Tahun Ini</option>
                <option value="">Semua</option>
              </select>
            </div>
            <div className="space-y-3">
              {cashiers.length > 0 ? cashiers.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-xs flex-shrink-0">
                    {c.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">{c.username}</p>
                    <p className="text-[10px] text-slate-400">{c.total_transaksi} transaksi</p>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 flex-shrink-0">{formatRp(Number(c.total_pendapatan))}</span>
                </div>
              )) : (
                <p className="text-sm text-slate-300 text-center py-6">Belum ada data</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
