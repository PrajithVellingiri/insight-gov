import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axiosInstance'; // to optionally save preference

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = async (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
    
    // Save preference to localStorage for guests, and DB for authenticated users
    localStorage.setItem('i18nextLng', code);
    
    if (user) {
      try {
        await api.patch('/auth/preferences', { language: code });
      } catch (_e) {
        // fail silently for now, as endpoint might not exist yet
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
        aria-label="Change language"
      >
        <Globe size={18} />
        <span className="text-sm font-medium hidden sm:block">{currentLang.native}</span>
        <ChevronDown size={14} className={cn('transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-card rounded-xl shadow-card-hover border border-border py-1 animate-fade-in z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between"
            >
              <span className={cn(currentLang.code === lang.code ? 'font-semibold text-primary-700' : 'text-foreground')}>
                {lang.native}
              </span>
              {currentLang.code === lang.code && <Check size={14} className="text-primary-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
