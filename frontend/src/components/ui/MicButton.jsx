import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import useSpeechRecognition from '@/hooks/useSpeechRecognition';
import { useAuth } from '@/context/AuthContext';

export default function MicButton({ onTranscript, className, disabled, language }) {
  const { user } = useAuth();
  const [interimText, setInterimText] = useState('');
  
  const handleResult = (finalTranscript, interimTranscript) => {
    if (finalTranscript) {
      onTranscript(finalTranscript);
      setInterimText('');
    } else {
      setInterimText(interimTranscript);
    }
  };

  const { isListening, isSupported, error, startListening, stopListening } = useSpeechRecognition({
    onResult: handleResult,
    onEnd: () => setInterimText(''),
    language
  });

  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    if (error) {
      setShowToast(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setShowToast(false), 3000);
    }
  }, [error]);

  if (!isSupported) return null;
  if (user && user.preferences && user.preferences.voice_input === false) return null;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={isListening ? stopListening : startListening}
        className={cn(
          "p-2 rounded-full transition-colors flex items-center justify-center disabled:opacity-50",
          isListening ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse" : "bg-secondary text-muted-foreground hover:bg-slate-200",
          className
        )}
        title={isListening ? "Stop listening" : "Start voice typing"}
      >
        {isListening ? <Mic size={18} /> : <MicOff size={18} />}
      </button>

      {/* Interim Text Tooltip overlay */}
      {isListening && interimText && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-black/80 text-white text-xs p-2 rounded-lg pointer-events-none z-50">
          {interimText}
        </div>
      )}

      {/* Error Toast */}
      {showToast && error && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-red-600 text-white text-xs p-2 rounded-lg pointer-events-none z-50">
          {error}
        </div>
      )}
    </div>
  );
}
