"use client";
import { useState, useEffect } from 'react';
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

const CACHE_KEY = 'pos_app_settings';

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
  const [settings, setSettings] = useState<AppSettings>(loadCache);

  useEffect(() => {
    api.get('/settings')
      .then(res => {
        const data: AppSettings = { ...DEFAULT, ...res.data.data };
        setSettings(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      })
      .catch(() => { /* gunakan cache */ });
  }, []);

  // Fungsi untuk refresh manual setelah update settings
  const refresh = () => {
    api.get('/settings')
      .then(res => {
        const data: AppSettings = { ...DEFAULT, ...res.data.data };
        setSettings(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      })
      .catch(() => {});
  };

  return { settings, refresh };
}

/** Util: invalidate cache supaya halaman lain ikut refresh */
export function invalidateSettingsCache() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
  }
}

export const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:8080';
