import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications, useMarkRead } from '@/hooks/useNotifications';
import { Bell, ChevronDown, LogOut, Menu, X, Shield, Check, Settings as SettingsIcon } from 'lucide-react';
import { cn, formatDateShort } from '@/lib/utils';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import SettingsModal from '@/components/ui/SettingsModal';

const roleLabels = { citizen: 'Citizen', officer: 'Government Officer', admin: 'Administrator' };
const roleColors = {
  citizen: 'bg-[#EFF4F0] text-[#315C4A] border-[#D4E2D8]',
  officer: 'bg-[#FDF6F0] text-[#C58B5B] border-[#F2DFD0]',
  admin: 'bg-[#FAF6ED] text-[#9A7B38] border-[#EFE5D2]',
};

export default function Navbar({ onMenuClick, sidebarOpen }) {
  const { user, role, logout } = useAuth();
  const { data: notifData } = useNotifications();
  const { mutate: markRead } = useMarkRead();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setDropOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unread = notifData?.filter?.((n) => !n.is_read)?.length ?? 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-[#E5E5DE] flex items-center px-4 sm:px-6 gap-4 transition-colors duration-200 shadow-subtle">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-[#F8F7F2] text-[#68716B] hover:text-[#202522] transition-colors lg:hidden"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-3 no-underline group">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#315C4A] text-white">
          <Shield size={18} strokeWidth={2} />
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="font-bold text-[#202522] text-base tracking-tight leading-tight font-sans">
            InsightGov
          </span>
          <span className="text-[10px] text-[#68716B] tracking-wider uppercase font-medium">
            Digital Governance Platform
          </span>
        </div>
      </Link>

      <div className="flex-1" />

      {/* Role badge */}
      {role && (
        <span className={cn('hidden md:inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium border', roleColors[role])}>
          <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5" />
          {roleLabels[role]}
        </span>
      )}

      {/* Language Switcher */}
      <LanguageSwitcher />

      {/* Settings Modal Toggle */}
      <button
        onClick={() => { setSettingsOpen(true); setDropOpen(false); setNotifOpen(false); }}
        className="p-2 rounded-lg hover:bg-[#F8F7F2] text-[#68716B] hover:text-[#202522] transition-colors"
        aria-label="Settings"
      >
        <SettingsIcon size={18} />
      </button>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => { setNotifOpen((p) => !p); setDropOpen(false); }}
          className="relative p-2 rounded-lg hover:bg-[#F8F7F2] text-[#68716B] hover:text-[#202522] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute 1 top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#C58B5B] text-white text-[10px] font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-dropdown border border-[#E5E5DE] py-2 animate-fade-in z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E5DE] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#202522]">Notifications</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-[#EFF4F0] text-[#315C4A] font-medium px-2 py-0.5 rounded-full">{unread} unread</span>
                {unread > 0 && (
                  <button 
                    onClick={() => {
                      notifData.filter(n => !n.is_read).forEach(n => markRead(n.id));
                    }}
                    className="text-xs text-[#315C4A] hover:text-[#223c31] font-medium transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-[320px] overflow-y-auto scrollbar-thin">
              {notifData?.length > 0 ? (
                notifData.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) markRead(n.id);
                    }}
                    className={cn(
                      'w-full text-left px-4 py-3 hover:bg-[#F8F7F2] border-b border-[#E5E5DE] transition-colors flex items-start justify-between gap-2',
                      !n.is_read ? 'bg-[#FAF9F5]' : 'opacity-80'
                    )}
                  >
                    <div>
                      <p className={cn("text-xs leading-snug", !n.is_read ? 'font-medium text-[#202522]' : 'text-[#68716B]')}>{n.message}</p>
                      <p className="text-[10px] text-[#68716B] mt-1 font-mono">{formatDateShort(n.created_at)}</p>
                    </div>
                    {n.is_read && <Check size={14} className="text-[#68716B] mt-0.5 flex-shrink-0" />}
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[#68716B]">No notifications recorded.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Profile Dropdown */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => { setDropOpen((p) => !p); setNotifOpen(false); }}
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-[#F8F7F2] transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-[#EFF4F0] border border-[#D4E2D8] flex items-center justify-center">
            <span className="text-xs font-semibold text-[#315C4A]">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="hidden sm:flex flex-col items-start text-left">
            <span className="text-xs font-semibold text-[#202522] leading-tight">{user?.name ?? 'User'}</span>
            <span className="text-[10px] text-[#68716B] truncate max-w-[120px]">{user?.email ?? ''}</span>
          </div>
          <ChevronDown size={14} className={cn('text-[#68716B] transition-transform duration-200', dropOpen && 'rotate-180')} />
        </button>

        {dropOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-dropdown border border-[#E5E5DE] py-1.5 animate-fade-in z-50">
            <div className="px-3.5 py-2.5 border-b border-[#E5E5DE]">
              <p className="text-[10px] text-[#68716B] uppercase font-semibold tracking-wider">Signed in as</p>
              <p className="text-xs font-semibold text-[#202522] truncate mt-0.5">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#b91c1c] hover:bg-[#FDF2F2] font-medium transition-colors"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        )}
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </header>
  );
}
