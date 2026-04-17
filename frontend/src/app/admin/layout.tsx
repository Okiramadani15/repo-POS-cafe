import Sidebar from '@/components/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      {/* Main content offset by sidebar width on desktop */}
      <div className="lg:ml-64 min-h-screen">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
