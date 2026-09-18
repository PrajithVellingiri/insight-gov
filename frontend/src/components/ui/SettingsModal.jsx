import { useState } from 'react';
import { Settings, X, Globe, Mic, Type, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axiosInstance';
import toast from 'react-hot-toast';
import { Moon } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="w-full max-w-md glass-panel-elevated border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-900/60">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Settings size={20} className="text-cyan-400" /> Settings
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Language */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Globe size={16} className="text-blue-400" /> Language
            </h3>
            <select
              value={preferences.language}
              onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
              className="form-input"
            >
              <option value="en">English</option>
              <option value="ta">Tamil (தமிழ்)</option>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="ml">Malayalam (മലയാളം)</option>
              <option value="te">Telugu (తెలుగు)</option>
              <option value="kn">Kannada (ಕನ್ನಡ)</option>
            </select>
          </div>
          
          <hr className="border-slate-800/80" />
          
          {/* Accessibility */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Monitor size={16} className="text-cyan-400" /> Accessibility
            </h3>
            
            <label className="flex items-center justify-between cursor-pointer group p-2.5 rounded-xl hover:bg-slate-800/40 transition-colors border border-transparent hover:border-slate-800">
              <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                <Mic size={16} className="text-slate-400 group-hover:text-cyan-400 transition-colors" /> Voice Input Enabled
              </div>
              <input
                type="checkbox"
                checked={preferences.voice_input}
                onChange={(e) => setPreferences({ ...preferences, voice_input: e.target.checked })}
                className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500/30 border-slate-700 bg-slate-900"
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer group p-2.5 rounded-xl hover:bg-slate-800/40 transition-colors border border-transparent hover:border-slate-800">
              <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                <Monitor size={16} className="text-slate-400 group-hover:text-cyan-400 transition-colors" /> High Contrast Mode
              </div>
              <input
                type="checkbox"
                checked={preferences.high_contrast}
                onChange={(e) => setPreferences({ ...preferences, high_contrast: e.target.checked })}
                className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500/30 border-slate-700 bg-slate-900"
              />
            </label>
            
            <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800/40 transition-colors border border-transparent hover:border-slate-800">
              <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                <Type size={16} className="text-slate-400" /> Font Size
              </div>
              <select
                value={preferences.font_size}
                onChange={(e) => setPreferences({ ...preferences, font_size: e.target.value })}
                className="w-32 rounded-lg border border-slate-700/80 bg-slate-900/90 text-foreground text-sm py-1.5 px-2.5 focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
          
        </div>
        
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary px-6">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="btn-primary px-6">
            {isSaving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
