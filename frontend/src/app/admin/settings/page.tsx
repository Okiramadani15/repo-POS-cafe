"use client";
import { useEffect, useRef, useState } from 'react';
import api from '@/api/axiosConfig';
import {
  Store, Lock, Database, Info, Save, Loader2,
  CheckCircle2, AlertCircle, Coffee, Globe,
  Phone, MapPin, Eye, EyeOff, Upload, ImageIcon, Trash2, RefreshCw
} from 'lucide-react';
import { useAppSettings, invalidateSettingsCache, BACKEND_URL } from '@/hooks/useAppSettings';

// ─── Section card wrapper ────────────────────────────────────────────────────
function SectionCard({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">{icon}</div>
        <h2 className="font-bold text-slate-800">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─── Logo upload card ─────────────────────────────────────────────────────────
function LogoUploadCard({
  label, hint, currentUrl, fieldName, onSuccess,
}: {
  label: string;
  hint: string;
  currentUrl: string | null;
  fieldName: 'logo' | 'login_logo';
  onSuccess: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile]       = useState<File | null>(null);
  const [saving, setSaving]   = useState(false);
  const [resetting, setResetting] = useState(false);
  const [msg, setMsg]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const showMsg = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 3 * 1024 * 1024) { showMsg('err', 'Ukuran file maksimal 3 MB'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!['image/jpeg','image/png','image/webp','image/svg+xml'].includes(f.type)) {
      showMsg('err', 'Format tidak didukung. Gunakan JPG, PNG, WebP, atau SVG'); return;
    }
    if (f.size > 3 * 1024 * 1024) { showMsg('err', 'Ukuran file maksimal 3 MB'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append(fieldName, file);
      await api.post('/settings/logo', fd);
      invalidateSettingsCache();
      onSuccess();
      setFile(null);
      setPreview(null);
      showMsg('ok', 'Logo berhasil disimpan!');
    } catch (err: any) {
      showMsg('err', err.response?.data?.message || 'Gagal mengunggah logo');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await api.delete(`/settings/logo/${fieldName}`);
      invalidateSettingsCache();
      onSuccess();
      showMsg('ok', 'Logo direset ke default');
    } catch (err: any) {
      showMsg('err', err.response?.data?.message || 'Gagal mereset logo');
    } finally {
      setResetting(false);
    }
  };

  const displayUrl = preview ?? (currentUrl ? `${BACKEND_URL}${currentUrl}` : null);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
      </div>

      <div className="flex gap-5 items-start flex-wrap">
        {/* Preview area */}
        <div className="flex-shrink-0">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
            {preview ? 'Preview Baru' : 'Logo Saat Ini'}
          </p>
          <div className="w-24 h-24 rounded-2xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt="Logo preview"
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-slate-300">
                <Coffee size={28} />
                <span className="text-[9px] font-medium">Default</span>
              </div>
            )}
            {preview && (
              <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">✓</span>
              </div>
            )}
          </div>
        </div>

        {/* Drop zone */}
        <div
          className="flex-1 min-w-48 border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
        >
          <Upload size={22} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-600">
            {file ? file.name : 'Klik atau drag & drop file'}
          </p>
          <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP, SVG · Maks 3 MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Feedback */}
      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium
          ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {msg.type === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {msg.text}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSave}
          disabled={!file || saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Simpan Logo
        </button>
        {currentUrl && (
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-600 rounded-xl font-semibold text-sm transition-colors disabled:opacity-40"
          >
            {resetting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Reset ke Default
          </button>
        )}
        {file && (
          <button
            onClick={() => { setFile(null); setPreview(null); }}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Batal pilih
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { settings, refresh } = useAppSettings();

  const [username, setUsername] = useState('');
  const [role, setRole]         = useState('');

  // Store info form — sync dari settings API
  const [store, setStore] = useState({
    store_name: '', tagline: '', phone: '', address: '',
  });
  const [storeSaving, setStoreSaving] = useState(false);
  const [storeMsg, setStoreMsg]       = useState('');

  // Password form
  const [pwForm, setPwForm]   = useState({ newPw: '', confirm: '' });
  const [showPw, setShowPw]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Ping
  const [pingStatus, setPingStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [pingMs, setPingMs]         = useState<number | null>(null);

  useEffect(() => {
    setUsername(localStorage.getItem('username') || '');
    setRole(localStorage.getItem('role') || '');
  }, []);

  // Sync form saat settings berubah
  useEffect(() => {
    setStore({
      store_name: settings.store_name ?? '',
      tagline:    settings.tagline    ?? '',
      phone:      settings.phone      ?? '',
      address:    settings.address    ?? '',
    });
  }, [settings]);

  // ─── Simpan info toko ke API ──────────────────────────────────────────────
  const handleStoreSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoreSaving(true);
    try {
      await api.put('/settings', store);
      invalidateSettingsCache();
      refresh();
      setStoreMsg('Disimpan!');
      setTimeout(() => setStoreMsg(''), 2500);
    } catch (err: any) {
      setStoreMsg('Gagal menyimpan');
    } finally {
      setStoreSaving(false);
    }
  };

  // ─── Ganti password ───────────────────────────────────────────────────────
  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.newPw.length < 6) { setPwMsg({ type: 'err', text: 'Password baru minimal 6 karakter' }); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg({ type: 'err', text: 'Konfirmasi password tidak cocok' }); return; }
    setPwSaving(true);
    try {
      const myId = localStorage.getItem('user_id');
      if (!myId) throw new Error('User ID tidak ditemukan, silakan login ulang');
      await api.put(`/users/${myId}`, { username, role, password: pwForm.newPw });
      setPwMsg({ type: 'ok', text: 'Password berhasil diganti!' });
      setPwForm({ newPw: '', confirm: '' });
    } catch (err: any) {
      setPwMsg({ type: 'err', text: err.response?.data?.message || 'Gagal mengganti password' });
    } finally {
      setPwSaving(false);
    }
  };

  // ─── Ping ─────────────────────────────────────────────────────────────────
  const handlePing = async () => {
    setPingStatus('loading'); setPingMs(null);
    const start = Date.now();
    try {
      await fetch(`${BACKEND_URL}/ping`);
      setPingMs(Date.now() - start); setPingStatus('ok');
    } catch { setPingStatus('err'); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Pengaturan</h1>
        <p className="text-sm text-slate-500 font-light">Konfigurasi tampilan, toko, dan akun.</p>
      </div>

      {/* ── LOGO APLIKASI ───────────────────────────────────────────────────── */}
      <SectionCard title="Logo Aplikasi" icon={<ImageIcon size={16} />}>
        <div className="space-y-8">
          {/* Info */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
            <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Logo yang diunggah akan muncul di <strong>sidebar navigasi</strong> dan <strong>halaman POS</strong>.
              Logo login akan muncul di <strong>halaman masuk</strong>. Gunakan format transparan (PNG/SVG) untuk hasil terbaik.
            </p>
          </div>

          <div className="divide-y divide-slate-100 space-y-6">
            {/* Logo utama */}
            <LogoUploadCard
              label="Logo Utama"
              hint="Tampil di sidebar (kiri) dan header halaman POS"
              currentUrl={settings.logo_url}
              fieldName="logo"
              onSuccess={refresh}
            />

            {/* Logo login */}
            <div className="pt-6">
              <LogoUploadCard
                label="Logo Halaman Login"
                hint="Tampil di tengah halaman login — bisa sama atau berbeda dengan logo utama"
                currentUrl={settings.login_logo_url}
                fieldName="login_logo"
                onSuccess={refresh}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── INFORMASI TOKO ──────────────────────────────────────────────────── */}
      <SectionCard title="Informasi Toko" icon={<Store size={16} />}>
        <form onSubmit={handleStoreSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Coffee size={13} className="inline mr-1.5 text-slate-400" />Nama Toko
              </label>
              <input
                type="text"
                value={store.store_name}
                onChange={e => setStore(s => ({ ...s, store_name: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
                placeholder="Point of Sale"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Globe size={13} className="inline mr-1.5 text-slate-400" />Tagline
              </label>
              <input
                type="text"
                value={store.tagline}
                onChange={e => setStore(s => ({ ...s, tagline: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
                placeholder="Cafe & Coffee Shop"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Phone size={13} className="inline mr-1.5 text-slate-400" />Nomor Telepon
              </label>
              <input
                type="text"
                value={store.phone}
                onChange={e => setStore(s => ({ ...s, phone: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
                placeholder="0812-xxxx-xxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <MapPin size={13} className="inline mr-1.5 text-slate-400" />Alamat
              </label>
              <input
                type="text"
                value={store.address}
                onChange={e => setStore(s => ({ ...s, address: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
                placeholder="Jl. Contoh No. 1"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={storeSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
            >
              {storeSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Simpan
            </button>
            {storeMsg && (
              <span className={`flex items-center gap-1.5 text-sm font-semibold ${storeMsg.startsWith('Gagal') ? 'text-red-600' : 'text-emerald-600'}`}>
                <CheckCircle2 size={14} /> {storeMsg}
              </span>
            )}
          </div>
        </form>
      </SectionCard>

      {/* ── GANTI PASSWORD ───────────────────────────────────────────────────── */}
      <SectionCard title="Ganti Password" icon={<Lock size={16} />}>
        <form onSubmit={handleChangePw} className="space-y-4">
          <div className="bg-slate-50 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-sm flex-shrink-0">
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-700 text-sm">{username}</p>
              <p className="text-xs text-slate-400 capitalize">{role}</p>
            </div>
          </div>

          {pwMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium
              ${pwMsg.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {pwMsg.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {pwMsg.text}
            </div>
          )}

          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password Baru</label>
            <input
              type={showPw ? 'text' : 'password'}
              required
              value={pwForm.newPw}
              onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
              className="w-full px-4 py-2.5 pr-11 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
              placeholder="Min. 6 karakter"
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Konfirmasi Password Baru</label>
            <input
              type={showPw ? 'text' : 'password'}
              required
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none"
              placeholder="Ulangi password baru"
            />
          </div>

          <button
            type="submit"
            disabled={pwSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
          >
            {pwSaving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            Ganti Password
          </button>
        </form>
      </SectionCard>

      {/* ── INFORMASI SISTEM ─────────────────────────────────────────────────── */}
      <SectionCard title="Informasi Sistem" icon={<Info size={16} />}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Versi Aplikasi</p>
              <p className="font-bold text-slate-700">v1.0.0</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Backend URL</p>
              <p className="font-bold text-slate-700 text-xs truncate">{BACKEND_URL}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Role Aktif</p>
              <p className="font-bold text-slate-700 capitalize">{role}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">User Aktif</p>
              <p className="font-bold text-slate-700">{username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handlePing}
              disabled={pingStatus === 'loading'}
              className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
            >
              {pingStatus === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
              Tes Koneksi Server
            </button>
            {pingStatus === 'ok'  && <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold"><CheckCircle2 size={14} /> Server OK {pingMs}ms</span>}
            {pingStatus === 'err' && <span className="flex items-center gap-1.5 text-sm text-red-500 font-semibold"><AlertCircle size={14} /> Tidak bisa terhubung</span>}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
