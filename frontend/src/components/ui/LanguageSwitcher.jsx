import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axiosInstance';

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
    
    localStorage.setItem('i18nextLng', code);
    
    if (user) {
      try {
        await api.patch('/auth/preferences', { language: code });
      } catch (_e) {
        // fail silently
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#DDDCD7] bg-white hover:bg-[#F7F6F2] text-[#181817] transition-colors"
        aria-label="Change language"
      >
        <Globe size={13} className="text-[#181817]" />
        <span className="text-xs font-mono font-medium hidden sm:block">{currentLang.native}</span>
        <ChevronDown size={11} className={cn('text-[#6F6F6A] transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-40 bg-white rounded-md shadow-elevated border border-[#DDDCD7] py-1 animate-fade-in z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-[#FFF0EB]/40 transition-colors flex items-center justify-between"
            >
              <span className={cn(currentLang.code === lang.code ? 'font-bold text-[#F05A3C]' : 'text-[#181817]')}>
                {lang.native}
              </span>
              {currentLang.code === lang.code && <Check size={12} className="text-[#F05A3C]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
