import { redirect } from 'next/navigation';

export default function Home() {
  // Langsung arahkan ke halaman login saat user buka localhost:3000
  redirect('/login');
}