import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatWidget from '../chatbot/ChatWidget';
import BackgroundGrid from '../ui/BackgroundGrid';

export default function PageWrapper({ role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#202522] relative selection:bg-[#315C4A]/20 selection:text-[#202522]">
      {/* Editorial subtle ivory background */}
      <BackgroundGrid />

      <Navbar
        onMenuClick={() => setSidebarOpen((p) => !p)}
        sidebarOpen={sidebarOpen}
      />
      <Sidebar
        role={role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="pt-16 lg:pl-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
