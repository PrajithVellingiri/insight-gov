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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Settings size={20} className="text-primary" /> Settings
          </h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Language */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Globe size={16} /> Language
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
          
          <hr className="border-border" />
          
          {/* Accessibility */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Monitor size={16} /> Accessibility
            </h3>
            
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                <Mic size={16} className="text-muted-foreground group-hover:text-primary transition-colors" /> Voice Input Enabled
              </div>
              <input
                type="checkbox"
                checked={preferences.voice_input}
                onChange={(e) => setPreferences({ ...preferences, voice_input: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-ring border-input bg-background"
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                <Monitor size={16} className="text-muted-foreground group-hover:text-primary transition-colors" /> High Contrast Mode
              </div>
              <input
                type="checkbox"
                checked={preferences.high_contrast}
                onChange={(e) => setPreferences({ ...preferences, high_contrast: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-ring border-input bg-background"
              />
            </label>
            
            <label className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                <Type size={16} className="text-muted-foreground group-hover:text-primary transition-colors" /> Font Size
              </div>
              <select
                value={preferences.font_size}
                onChange={(e) => setPreferences({ ...preferences, font_size: e.target.value })}
                className="w-32 rounded border border-input bg-background text-foreground text-sm py-1 px-2 focus:ring-2 focus:ring-ring"
              >
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </label>
          </div>
          
        </div>
        
        <div className="p-4 border-t border-border bg-muted/50 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary px-6">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="btn-primary px-6">
            {isSaving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
