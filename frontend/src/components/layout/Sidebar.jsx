import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, FileSearch,
  Building2, Users, Home, History, Activity, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navConfigs = {
  citizen: [
    { to: '/citizen/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/citizen/petitions/new', icon: FilePlus, label: 'Submit Petition' },
  ],
  officer: [
    { to: '/officer/dashboard', icon: LayoutDashboard, label: 'Queue Dashboard' },
    { to: '/officer/search', icon: FileSearch, label: 'Semantic AI Search' },
    { to: '/officer/resolution-history', icon: History, label: 'Resolution History' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Command Center' },
    { to: '/admin/departments', icon: Building2, label: 'Departments' },
    { to: '/admin/officers', icon: Users, label: 'Officers' },
    { to: '/admin/officer-analytics', icon: Activity, label: 'Officer Analytics' },
  ],
};

export default function Sidebar({ role, open, onClose }) {
  const navItems = navConfigs[role] ?? [];

  return (
    <>
      {/* Overlay on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-md lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-slate-950/70 backdrop-blur-2xl border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles size={12} className="text-blue-400" />
            Navigation
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase font-semibold">
            {role}
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 group relative',
                  isActive
                    ? 'nav-item-active text-blue-400 font-semibold'
                    : 'text-muted-foreground hover:bg-slate-800/50 hover:text-foreground'
                )
              }
            >
              <Icon size={18} className="transition-transform duration-200 group-hover:scale-110" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-medium text-muted-foreground hover:bg-slate-800/50 hover:text-foreground transition-all duration-200"
          >
            <Home size={18} />
            <span>Public Portal</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
