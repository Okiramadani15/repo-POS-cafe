"use client";
import { useState, useEffect, useCallback } from 'react';
import api from '@/api/axiosConfig';

export interface AppSettings {
  store_name:      string;
  tagline:         string;
  phone:           string;
  address:         string;
  logo_url:        string | null;
  login_logo_url:  string | null;
  primary_color:   string;
}

const CACHE_KEY    = 'pos_app_settings';
const SETTINGS_EVT = 'pos:settings-updated';

const DEFAULT: AppSettings = {
  store_name:     'Point of Sale',
  tagline:        'Cafe & Coffee Shop',
  phone:          '',
  address:        '',
  logo_url:       null,
  login_logo_url: null,
  primary_color:  '#2563eb',
};

function loadCache(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function useAppSettings() {
  // Selalu mulai dari DEFAULT — server dan client harus sama di render pertama.
  // Jika dimulai dari loadCache(), server render DEFAULT (localStorage tidak ada)
  // sementara client render dari cache → hydration mismatch.
  const [settings, setSettings] = useState<AppSettings>(DEFAULT);

  const fetchAndCache = useCallback(() => {
    api.get('/settings')
      .then(res => {
        const data: AppSettings = { ...DEFAULT, ...res.data.data };
        setSettings(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Setelah mount (client-only): terapkan cache lokal dulu agar tidak flicker,
    // lalu langsung fetch API untuk data terbaru.
    const cached = loadCache();
    setSettings(cached);

    fetchAndCache();

    window.addEventListener(SETTINGS_EVT, fetchAndCache);
    return () => window.removeEventListener(SETTINGS_EVT, fetchAndCache);
  }, [fetchAndCache]);

  /** Refresh manual + broadcast ke semua komponen yang pakai hook ini */
  const refresh = useCallback(() => {
    localStorage.removeItem(CACHE_KEY);
    fetchAndCache();
    window.dispatchEvent(new Event(SETTINGS_EVT));
  }, [fetchAndCache]);

  return { settings, refresh };
}

/** Broadcast update settings ke semua instance hook (Sidebar, Login, POS, dst.) */
export function invalidateSettingsCache() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
    window.dispatchEvent(new Event(SETTINGS_EVT));
  }
}

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:8080';
