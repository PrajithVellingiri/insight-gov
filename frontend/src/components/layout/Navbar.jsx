import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications, useMarkRead } from '@/hooks/useNotifications';
import { Bell, ChevronDown, LogOut, Menu, X, Check, Settings as SettingsIcon } from 'lucide-react';
import { cn, formatDateShort } from '@/lib/utils';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import SettingsModal from '@/components/ui/SettingsModal';

const roleLabels = { citizen: 'Citizen', officer: 'Officer', admin: 'Administrator' };

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

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

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
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-[#F7F6F2] border-b border-[#DDDCD7] flex items-center px-4 sm:px-6 gap-3 transition-colors">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="p-1.5 rounded-md hover:bg-[#EFEFEA] text-[#181817] transition-colors lg:hidden"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Operations Tracker Header */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#181817]" />
          <span className="font-bold text-sm tracking-tight text-[#181817] font-mono uppercase">
            InsightGov
          </span>
        </Link>
        <span className="hidden md:inline-block h-3.5 w-px bg-[#DDDCD7]" />
        <span className="hidden md:inline-block text-xs font-mono uppercase tracking-wider text-[#6F6F6A]">
          Government Operations
        </span>
      </div>

      <div className="flex-1" />

      {/* Date Stamp */}
      <div className="hidden lg:block text-xs font-mono text-[#6F6F6A]">
        {currentDate}
      </div>

      <div className="hidden md:block h-3.5 w-px bg-[#DDDCD7]" />

      {/* Role Indicator */}
      {role && (
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono uppercase tracking-wider bg-white border border-[#DDDCD7] text-[#181817]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F05A3C]" />
          {roleLabels[role]}
        </span>
      )}

      {/* Language Switcher */}
      <LanguageSwitcher />

      {/* Settings Modal Toggle */}
      <button
        onClick={() => { setSettingsOpen(true); setDropOpen(false); setNotifOpen(false); }}
        className="p-1.5 rounded-md hover:bg-[#EFEFEA] text-[#6F6F6A] hover:text-[#181817] transition-colors"
        aria-label="Settings"
      >
        <SettingsIcon size={16} />
      </button>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => { setNotifOpen((p) => !p); setDropOpen(false); }}
          className="relative p-1.5 rounded-md hover:bg-[#EFEFEA] text-[#6F6F6A] hover:text-[#181817] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={16} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#F05A3C] text-white text-[9px] font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-md shadow-elevated border border-[#DDDCD7] py-2 animate-fade-in z-50 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#DDDCD7] flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#181817]">Notifications</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase bg-[#FFF0EB] text-[#F05A3C] font-semibold px-2 py-0.5 rounded">
                  {unread} unread
                </span>
                {unread > 0 && (
                  <button 
                    onClick={() => {
                      notifData.filter(n => !n.is_read).forEach(n => markRead(n.id));
                    }}
                    className="text-xs text-[#181817] hover:text-[#F05A3C] font-semibold transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifData?.length > 0 ? (
                notifData.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) markRead(n.id);
                    }}
                    className={cn(
                      'w-full text-left px-4 py-2.5 hover:bg-[#F7F6F2] border-b border-[#DDDCD7]/70 transition-colors flex items-start justify-between gap-2',
                      !n.is_read ? 'bg-[#FFF0EB]/30' : 'opacity-70'
                    )}
                  >
                    <div>
                      <p className={cn("text-xs leading-snug", !n.is_read ? 'font-semibold text-[#181817]' : 'text-[#6F6F6A]')}>{n.message}</p>
                      <p className="text-[10px] text-[#6F6F6A] mt-1 font-mono">{formatDateShort(n.created_at)}</p>
                    </div>
                    {n.is_read && <Check size={13} className="text-[#6F6F6A] mt-0.5 flex-shrink-0" />}
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[#6F6F6A]">No notifications.</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="h-3.5 w-px bg-[#DDDCD7]" />

      {/* User Profile */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => { setDropOpen((p) => !p); setNotifOpen(false); }}
          className="flex items-center gap-2 rounded-md p-1 hover:bg-[#EFEFEA] transition-colors"
        >
          <div className="h-7 w-7 rounded-full bg-[#181817] text-white flex items-center justify-center text-xs font-bold">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <ChevronDown size={13} className={cn('text-[#6F6F6A] transition-transform', dropOpen && 'rotate-180')} />
        </button>

        {dropOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-md shadow-elevated border border-[#DDDCD7] py-1 animate-fade-in z-50">
            <div className="px-3.5 py-2 border-b border-[#DDDCD7]">
              <p className="text-[10px] text-[#6F6F6A] uppercase font-mono tracking-wider">Signed in as</p>
              <p className="text-xs font-bold text-[#181817] truncate mt-0.5">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-[#E13B22] hover:bg-[#FDF2F0] font-semibold transition-colors"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        )}
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </header>
  );
}
