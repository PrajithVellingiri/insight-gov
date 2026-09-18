import { useState } from 'react';
import { Settings, X, Globe, Mic, Type, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axiosInstance';
import toast from 'react-hot-toast';

export default function SettingsModal({ onClose }) {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  
  const [preferences, setPreferences] = useState(
    user?.preferences || {
      language: i18n.language || 'en',
      voice_input: true,
      high_contrast: document.documentElement.classList.contains('high-contrast'),
      font_size: document.documentElement.classList.contains('font-large') ? 'large' : 'medium',
    }
  );
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Apply locally
    i18n.changeLanguage(preferences.language);
    
    if (preferences.high_contrast) document.documentElement.classList.add('high-contrast');
    else document.documentElement.classList.remove('high-contrast');
    
    if (preferences.font_size === 'large') document.documentElement.classList.add('font-large');
    else document.documentElement.classList.remove('font-large');
    
    // Save to user if authenticated
    if (user) {
      try {
        await api.patch('/auth/preferences', preferences);
        user.preferences = preferences; // optimistic update
        toast.success("Preferences saved successfully!");
      } catch (err) {
        console.error("Failed to save preferences", err);
        toast.error("Failed to save preferences.");
      }
    } else {
      toast.success("Preferences applied locally!");
    }
    
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202522]/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white border border-[#E5E5DE] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5DE] bg-[#F8F7F2]">
          <h2 className="text-base font-bold text-[#202522] flex items-center gap-2">
            <Settings size={18} className="text-[#315C4A]" /> System Preferences
          </h2>
          <button 
            onClick={onClose} 
            className="p-1.5 text-[#68716B] hover:text-[#202522] hover:bg-[#E5E5DE]/50 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Language Selection */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#68716B] flex items-center gap-2">
              <Globe size={14} className="text-[#315C4A]" /> Interface Language
            </h3>
            <select
              value={preferences.language}
              onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#F8F7F2] border border-[#E5E5DE] rounded-xl text-sm text-[#202522] focus:outline-none focus:border-[#315C4A] focus:bg-white transition-colors"
            >
              <option value="en">English (Official)</option>
              <option value="ta">Tamil (தமிழ்)</option>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="ml">Malayalam (മലയാളം)</option>
              <option value="te">Telugu (తెలుగు)</option>
              <option value="kn">Kannada (ಕನ್ನಡ)</option>
            </select>
          </div>
          
          <hr className="border-[#E5E5DE]" />
          
          {/* Accessibility Settings */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#68716B] flex items-center gap-2">
              <Monitor size={14} className="text-[#315C4A]" /> Accessibility & Input
            </h3>
            
            <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-[#F8F7F2] transition-colors border border-transparent hover:border-[#E5E5DE]">
              <div className="flex items-center gap-2.5 text-sm text-[#202522] font-medium">
                <Mic size={16} className="text-[#68716B]" /> Voice Input Enabled
              </div>
              <input
                type="checkbox"
                checked={preferences.voice_input}
                onChange={(e) => setPreferences({ ...preferences, voice_input: e.target.checked })}
                className="w-4 h-4 rounded text-[#315C4A] focus:ring-[#315C4A]/30 border-[#E5E5DE]"
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl hover:bg-[#F8F7F2] transition-colors border border-transparent hover:border-[#E5E5DE]">
              <div className="flex items-center gap-2.5 text-sm text-[#202522] font-medium">
                <Monitor size={16} className="text-[#68716B]" /> High Contrast Mode
              </div>
              <input
                type="checkbox"
                checked={preferences.high_contrast}
                onChange={(e) => setPreferences({ ...preferences, high_contrast: e.target.checked })}
                className="w-4 h-4 rounded text-[#315C4A] focus:ring-[#315C4A]/30 border-[#E5E5DE]"
              />
            </label>
            
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F8F7F2] transition-colors border border-transparent hover:border-[#E5E5DE]">
              <div className="flex items-center gap-2.5 text-sm text-[#202522] font-medium">
                <Type size={16} className="text-[#68716B]" /> Typography Scale
              </div>
              <select
                value={preferences.font_size}
                onChange={(e) => setPreferences({ ...preferences, font_size: e.target.value })}
                className="w-32 rounded-lg border border-[#E5E5DE] bg-[#F8F7F2] text-[#202522] text-xs py-1.5 px-2.5 focus:border-[#315C4A] focus:bg-white"
              >
                <option value="medium">Standard (100%)</option>
                <option value="large">Large (115%)</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E5E5DE] bg-[#F8F7F2] flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary px-5 py-2 text-xs">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} className="btn-primary px-5 py-2 text-xs">
            {isSaving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
