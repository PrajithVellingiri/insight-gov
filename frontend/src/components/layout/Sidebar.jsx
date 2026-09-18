import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, FileSearch,
  Building2, Users, Home, History, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navConfigs = {
  citizen: [
    { to: '/citizen/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/citizen/petitions/new', icon: FilePlus, label: 'Submit Petition' },
  ],
  officer: [
    { to: '/officer/dashboard', icon: LayoutDashboard, label: 'Queue Overview' },
    { to: '/officer/search', icon: FileSearch, label: 'Semantic Search' },
    { to: '/officer/resolution-history', icon: History, label: 'Resolution Archive' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Executive Overview' },
    { to: '/admin/departments', icon: Building2, label: 'Departments' },
    { to: '/admin/officers', icon: Users, label: 'Officers' },
    { to: '/admin/officer-analytics', icon: Activity, label: 'Workload Analytics' },
  ],
};

export default function Sidebar({ role, open, onClose }) {
  const navItems = navConfigs[role] ?? [];

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-[#202522]/20 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-white border-r border-[#E5E5DE] flex flex-col transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        {/* Section Header */}
        <div className="px-5 py-4 border-b border-[#E5E5DE] flex items-center justify-between">
          <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#68716B]">
            01 / NAVIGATION
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#EFF4F0] text-[#315C4A] border border-[#D4E2D8] uppercase tracking-wider">
            {role}
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 relative',
                  isActive
                    ? 'bg-[#EFF4F0] text-[#315C4A] font-semibold border-l-[3px] border-l-[#315C4A] rounded-l-none pl-3'
                    : 'text-[#68716B] hover:bg-[#F8F7F2] hover:text-[#202522]'
                )
              }
            >
              <Icon size={16} strokeWidth={1.75} className="flex-shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer / Public Link */}
        <div className="p-3 border-t border-[#E5E5DE]">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[#68716B] hover:bg-[#F8F7F2] hover:text-[#202522] transition-colors"
          >
            <Home size={16} strokeWidth={1.75} />
            <span>Public Portal</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
