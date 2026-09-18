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
    
    i18n.changeLanguage(preferences.language);
    
    if (preferences.high_contrast) document.documentElement.classList.add('high-contrast');
    else document.documentElement.classList.remove('high-contrast');
    
    if (preferences.font_size === 'large') document.documentElement.classList.add('font-large');
    else document.documentElement.classList.remove('font-large');
    
    if (user) {
      try {
        await api.patch('/auth/preferences', preferences);
        user.preferences = preferences;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181817]/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white border border-[#DDDCD7] rounded-md shadow-elevated overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#DDDCD7] bg-[#F7F6F2]">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#181817] flex items-center gap-2">
            <Settings size={15} className="text-[#F05A3C]" /> System Preferences
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 text-[#6F6F6A] hover:text-[#181817] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Language Selection */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6F6F6A] flex items-center gap-2">
              <Globe size={13} className="text-[#181817]" /> Interface Language
            </h3>
            <select
              value={preferences.language}
              onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-[#DDDCD7] rounded-md text-xs text-[#181817] focus:outline-none focus:border-[#F05A3C] transition-colors"
            >
              <option value="en">English (Official)</option>
              <option value="ta">Tamil (தமிழ்)</option>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="ml">Malayalam (മലയാളം)</option>
              <option value="te">Telugu (తెలుగు)</option>
              <option value="kn">Kannada (ಕನ್ನಡ)</option>
            </select>
          </div>
          
          <hr className="border-[#DDDCD7]" />
          
          {/* Accessibility Settings */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6F6F6A] flex items-center gap-2">
              <Monitor size={13} className="text-[#181817]" /> Accessibility & Input
            </h3>
            
            <label className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-[#F7F6F2] transition-colors">
              <div className="flex items-center gap-2 text-xs text-[#181817] font-medium">
                <Mic size={14} className="text-[#6F6F6A]" /> Voice Input Enabled
              </div>
              <input
                type="checkbox"
                checked={preferences.voice_input}
                onChange={(e) => setPreferences({ ...preferences, voice_input: e.target.checked })}
                className="w-4 h-4 rounded text-[#F05A3C] focus:ring-[#F05A3C] border-[#DDDCD7]"
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-[#F7F6F2] transition-colors">
              <div className="flex items-center gap-2 text-xs text-[#181817] font-medium">
                <Monitor size={14} className="text-[#6F6F6A]" /> High Contrast Mode
              </div>
              <input
                type="checkbox"
                checked={preferences.high_contrast}
                onChange={(e) => setPreferences({ ...preferences, high_contrast: e.target.checked })}
                className="w-4 h-4 rounded text-[#F05A3C] focus:ring-[#F05A3C] border-[#DDDCD7]"
              />
            </label>
            
            <div className="flex items-center justify-between p-2 rounded hover:bg-[#F7F6F2] transition-colors">
              <div className="flex items-center gap-2 text-xs text-[#181817] font-medium">
                <Type size={14} className="text-[#6F6F6A]" /> Typography Scale
              </div>
              <select
                value={preferences.font_size}
                onChange={(e) => setPreferences({ ...preferences, font_size: e.target.value })}
                className="w-28 rounded border border-[#DDDCD7] bg-white text-[#181817] text-xs py-1 px-2 focus:border-[#F05A3C]"
              >
                <option value="medium">Standard</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#DDDCD7] bg-[#F7F6F2] flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary px-4 py-1.5 text-xs">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} className="btn-primary px-4 py-1.5 text-xs">
            {isSaving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
