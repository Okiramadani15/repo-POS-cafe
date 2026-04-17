"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      router.replace('/login');
      return;
    }

    if (role === 'admin' || role === 'owner') {
      setAuthorized(true);
    } else {
      // kasir hanya boleh akses halaman POS
      router.replace('/pos');
    }
  }, [router]);

  return authorized ? <>{children}</> : null;
}