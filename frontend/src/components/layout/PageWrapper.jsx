import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function PageWrapper({ role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        onMenuClick={() => setSidebarOpen((p) => !p)}
        sidebarOpen={sidebarOpen}
      />
      <Sidebar
        role={role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="pt-16 lg:pl-60">
        <div className="max-w-7xl mx-auto p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
