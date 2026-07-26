import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, FileSearch, BarChart3,
  Building2, Users, ClipboardList, Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navConfigs = {
  citizen: [
    { to: '/citizen/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/citizen/petitions/new', icon: FilePlus, label: 'Submit Petition' },
  ],
  officer: [
    { to: '/officer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/officer/search', icon: FileSearch, label: 'Semantic Search' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/departments', icon: Building2, label: 'Departments' },
    { to: '/admin/officers', icon: Users, label: 'Officers' },
  ],
};

export default function Sidebar({ role, open, onClose }) {
  const navItems = navConfigs[role] ?? [];

  return (
    <>
      {/* Overlay on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-60 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(isActive ? 'nav-item-active' : 'nav-item')
              }
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <NavLink to="/" className="nav-item">
            <Home size={17} />
            <span>Home</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
