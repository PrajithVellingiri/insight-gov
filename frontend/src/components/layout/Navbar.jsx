import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, ChevronDown, LogOut, User, Menu, X, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const roleLabels = { citizen: 'Citizen', officer: 'Government Officer', admin: 'Administrator' };
const roleColors = { citizen: 'bg-accent-50 text-accent-700', officer: 'bg-primary-50 text-primary-700', admin: 'bg-purple-50 text-purple-700' };

export default function Navbar({ onMenuClick, sidebarOpen }) {
  const { user, role, logout } = useAuth();
  const { data: notifData } = useNotifications();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);

  const unread = notifData?.filter?.((n) => !n.is_read)?.length ?? 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-slate-200 flex items-center px-4 gap-4">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors lg:hidden"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 no-underline">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-700">
          <ShieldCheck size={16} className="text-white" />
        </div>
        <span className="font-bold text-slate-900 text-base tracking-tight hidden sm:block">
          InsightGov <span className="text-primary-600">AI</span>
        </span>
      </Link>

      <div className="flex-1" />

      {/* Role badge */}
      {role && (
        <span className={cn('hidden md:inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', roleColors[role])}>
          {roleLabels[role]}
        </span>
      )}

      {/* Notifications */}
      <Link
        to={role ? `/${role}/dashboard` : '/'}
        className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 no-underline"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Link>

      {/* User dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropOpen((p) => !p)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-700">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium text-slate-800 leading-tight">{user?.name ?? 'User'}</span>
            <span className="text-xs text-slate-500">{user?.email ?? ''}</span>
          </div>
          <ChevronDown size={14} className={cn('text-slate-400 transition-transform', dropOpen && 'rotate-180')} />
        </button>

        {dropOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-card-hover border border-slate-100 py-1 animate-fade-in z-50">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-xs text-slate-500">Signed in as</p>
              <p className="text-sm font-medium text-slate-800 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
