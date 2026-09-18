import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications, useMarkRead } from '@/hooks/useNotifications';
import { Bell, ChevronDown, LogOut, Menu, X, ShieldCheck, Check, Settings as SettingsIcon } from 'lucide-react';
import { cn, formatDateShort } from '@/lib/utils';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import SettingsModal from '@/components/ui/SettingsModal';

const roleLabels = { citizen: 'Citizen', officer: 'Government Officer', admin: 'Administrator' };
const roleColors = {
  citizen: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
  officer: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
  admin: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
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
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-slate-950/75 backdrop-blur-2xl border-b border-slate-800/80 flex items-center px-4 gap-4 transition-colors duration-200 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-xl hover:bg-slate-800/60 text-muted-foreground hover:text-foreground transition-colors lg:hidden"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Brand Logo with 3D Shield */}
      <Link to="/" className="flex items-center gap-3 no-underline group">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-400/40 transition-transform duration-300 group-hover:scale-105">
          <ShieldCheck size={18} className="text-white drop-shadow-sm" />
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="font-bold text-foreground text-base tracking-tight leading-tight flex items-center gap-1.5">
            InsightGov <span className="text-xs px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-400/30 font-semibold tracking-wider uppercase">AI</span>
          </span>
          <span className="text-[10px] text-muted-foreground tracking-wider uppercase font-medium">Digital Public Infrastructure</span>
        </div>
      </Link>

      <div className="flex-1" />

      {/* Role badge */}
      {role && (
        <span className={cn('hidden md:inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide', roleColors[role])}>
          <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
          {roleLabels[role]}
        </span>
      )}

      {/* Language Switcher */}
      <LanguageSwitcher />

      {/* Settings Modal Toggle */}
      <button
        onClick={() => { setSettingsOpen(true); setDropOpen(false); setNotifOpen(false); }}
        className="p-2 rounded-xl hover:bg-slate-800/60 text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-slate-700/60"
        aria-label="Settings"
      >
        <SettingsIcon size={18} />
      </button>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => { setNotifOpen((p) => !p); setDropOpen(false); }}
          className="relative p-2 rounded-xl hover:bg-slate-800/60 text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-slate-700/60"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-[0_0_8px_rgba(244,63,94,0.6)]">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-84 bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-700/70 py-2 animate-fade-in z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-800 text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-500/20">{unread} unread</span>
                {unread > 0 && (
                  <button 
                    onClick={() => {
                      notifData.filter(n => !n.is_read).forEach(n => markRead(n.id));
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
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
                      'w-full text-left px-4 py-3 hover:bg-slate-800/50 border-b border-slate-800/50 transition-colors flex items-start justify-between gap-2',
                      !n.is_read ? 'bg-blue-600/10' : 'opacity-70'
                    )}
                  >
                    <div>
                      <p className={cn("text-sm leading-snug", !n.is_read ? 'font-medium text-foreground' : 'text-muted-foreground')}>{n.message}</p>
                      <p className="text-[11px] text-muted-foreground mt-1 font-mono">{formatDateShort(n.created_at)}</p>
                    </div>
                    {n.is_read && <Check size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />}
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Profile Dropdown */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => { setDropOpen((p) => !p); setNotifOpen(false); }}
          className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-700/60"
        >
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center shadow-sm">
            <span className="text-xs font-bold text-blue-400">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="hidden sm:flex flex-col items-start text-left">
            <span className="text-sm font-semibold text-foreground leading-tight">{user?.name ?? 'User'}</span>
            <span className="text-[11px] text-muted-foreground truncate max-w-[130px]">{user?.email ?? ''}</span>
          </div>
          <ChevronDown size={14} className={cn('text-muted-foreground transition-transform duration-200', dropOpen && 'rotate-180')} />
        </button>

        {dropOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-700/70 py-1.5 animate-fade-in z-50">
            <div className="px-3.5 py-2.5 border-b border-slate-800/80">
              <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">Signed in as</p>
              <p className="text-sm font-bold text-foreground truncate mt-0.5">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-rose-400 hover:bg-rose-500/10 font-medium transition-colors"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        )}
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </header>
  );
}
