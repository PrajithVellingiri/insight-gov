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
          "p-2 rounded-md transition-all flex items-center justify-center disabled:opacity-50 border",
          isListening 
            ? "bg-[#FFF0EB] text-[#F05A3C] border-[#F05A3C] animate-pulse" 
            : "bg-[#F7F6F2] text-[#6F6F6A] hover:text-[#181817] hover:border-[#181817] border-[#DDDCD7]",
          className
        )}
        title={isListening ? "Stop listening" : "Start voice typing"}
      >
        {isListening ? <Mic size={15} /> : <MicOff size={15} />}
      </button>

      {isListening && interimText && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-[#181817] text-white text-xs p-2 rounded pointer-events-none z-50 shadow-elevated">
          {interimText}
        </div>
      )}

      {showToast && error && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-[#E13B22] text-white text-xs p-2 rounded pointer-events-none z-50 shadow-elevated">
          {error}
        </div>
      )}
    </div>
  );
}
