import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotifications, useMarkRead } from '@/hooks/useNotifications';
import { Bell, ChevronDown, LogOut, Menu, X, ShieldCheck, Check, Settings as SettingsIcon } from 'lucide-react';
import { cn, formatDateShort } from '@/lib/utils';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import SettingsModal from '@/components/ui/SettingsModal';

const roleLabels = { citizen: 'Citizen', officer: 'Government Officer', admin: 'Administrator' };
const roleColors = { citizen: 'bg-accent/10 text-accent', officer: 'bg-primary/10 text-primary', admin: 'bg-destructive/10 text-destructive' };

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
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-card border-b border-border flex items-center px-4 gap-4 transition-colors duration-200">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors lg:hidden"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 no-underline">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <ShieldCheck size={16} className="text-primary-foreground" />
        </div>
        <span className="font-bold text-foreground text-base tracking-tight hidden sm:block">
          InsightGov <span className="text-primary">AI</span>
        </span>
      </Link>

      <div className="flex-1" />

      {/* Role badge */}
      {role && (
        <span className={cn('hidden md:inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', roleColors[role])}>
          {roleLabels[role]}
        </span>
      )}

      {/* Language Switcher */}
      <LanguageSwitcher />

      {/* Settings */}
      <button
        onClick={() => { setSettingsOpen(true); setDropOpen(false); setNotifOpen(false); }}
        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
        aria-label="Settings"
      >
        <SettingsIcon size={20} />
      </button>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => { setNotifOpen((p) => !p); setDropOpen(false); }}
          className="relative p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-1 w-80 bg-card rounded-xl shadow-card-hover border border-border py-2 animate-fade-in z-50">
            <div className="px-4 py-2 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{unread} unread</span>
                {unread > 0 && (
                  <button 
                    onClick={() => {
                      notifData.filter(n => !n.is_read).forEach(n => markRead(n.id));
                    }}
                    className="text-xs text-primary hover:text-primary/80 font-medium"
                  >
                    Mark all read
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
                      'w-full text-left px-4 py-3 hover:bg-secondary border-b border-border transition-colors flex items-start justify-between gap-2',
                      !n.is_read ? 'bg-primary/5' : 'opacity-70'
                    )}
                  >
                    <div>
                      <p className={cn("text-sm", !n.is_read ? 'font-medium text-foreground' : 'text-muted-foreground')}>{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDateShort(n.created_at)}</p>
                    </div>
                    {n.is_read && <Check size={14} className="text-muted-foreground mt-0.5" />}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No notifications yet.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User dropdown */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => { setDropOpen((p) => !p); setNotifOpen(false); }}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-secondary transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium text-foreground leading-tight">{user?.name ?? 'User'}</span>
            <span className="text-xs text-muted-foreground">{user?.email ?? ''}</span>
          </div>
          <ChevronDown size={14} className={cn('text-muted-foreground transition-transform', dropOpen && 'rotate-180')} />
        </button>

        {dropOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-card rounded-xl shadow-card-hover border border-border py-1 animate-fade-in z-50">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
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
