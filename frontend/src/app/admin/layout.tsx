import AdminGuard from '@/components/AdminGuard';
import Sidebar from '@/components/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar />
        {/* ml-0 di mobile, ml-64 di desktop (lg) */}
        <main className="flex-1 lg:ml-64 p-4 md:p-8 pt-20 lg:pt-8 transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}