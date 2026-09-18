import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FilePlus, FileSearch,
  Building2, Users, Home, History, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navGroups = {
  citizen: [
    {
      group: 'OVERVIEW',
      items: [
        { to: '/citizen/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ]
    },
    {
      group: 'APPLICATIONS',
      items: [
        { to: '/citizen/petitions/new', icon: FilePlus, label: 'Submit Application' },
      ]
    }
  ],
  officer: [
    {
      group: 'OVERVIEW',
      items: [
        { to: '/officer/dashboard', icon: LayoutDashboard, label: 'Queue Overview' },
      ]
    },
    {
      group: 'INTELLIGENCE',
      items: [
        { to: '/officer/search', icon: FileSearch, label: 'Semantic Search' },
        { to: '/officer/resolution-history', icon: History, label: 'Resolution Archive' },
      ]
    }
  ],
  admin: [
    {
      group: 'OVERVIEW',
      items: [
        { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Operations Overview' },
      ]
    },
    {
      group: 'ADMINISTRATION',
      items: [
        { to: '/admin/departments', icon: Building2, label: 'Departments' },
        { to: '/admin/officers', icon: Users, label: 'Officers' },
      ]
    },
    {
      group: 'INTELLIGENCE',
      items: [
        { to: '/admin/officer-analytics', icon: Activity, label: 'Workload Analytics' },
      ]
    }
  ],
};

export default function Sidebar({ role, open, onClose }) {
  const groups = navGroups[role] ?? [];

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-[#181817]/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-14 left-0 z-30 h-[calc(100vh-3.5rem)] w-60 bg-[#181817] border-r border-[#292927] flex flex-col transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-[#292927] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F05A3C]" />
            <span className="text-xs font-mono font-bold tracking-widest text-[#F7F6F2] uppercase">
              INSIGHTGOV
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#292927] text-[#A3A39E]">
            {role}
          </span>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {groups.map((grp) => (
            <div key={grp.group} className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[#6F6F6A]">
                {grp.group}
              </div>
              {grp.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group',
                      isActive
                        ? 'bg-[#292927] text-white font-semibold border-l-2 border-l-[#F05A3C] rounded-l-none pl-2.5'
                        : 'text-[#A3A39E] hover:text-[#F7F6F2] hover:bg-[#292927]/60'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5">
                        <Icon size={15} strokeWidth={1.75} className={isActive ? 'text-[#F05A3C]' : 'text-[#6F6F6A] group-hover:text-[#A3A39E]'} />
                        <span>{label}</span>
                      </div>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F05A3C]" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer / Public Link */}
        <div className="p-3 border-t border-[#292927]">
          <NavLink
            to="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-[#6F6F6A] hover:text-[#F7F6F2] hover:bg-[#292927]/60 transition-colors"
          >
            <Home size={15} strokeWidth={1.75} />
            <span>Public Portal</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}
