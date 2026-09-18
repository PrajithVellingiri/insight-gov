import { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import MicButton from '@/components/ui/MicButton';
import { useTranslation } from 'react-i18next';

export default function ChatInput({ onSend, onSendMessage, isStreaming, disabled, placeholder }) {
  const { t, i18n } = useTranslation();
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);
  const isBusy = isStreaming || disabled;

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isBusy) return;
    const sendFn = onSendMessage || onSend;
    if (sendFn) {
      sendFn(trimmed);
    }
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleTranscript = (text) => {
    setValue((prev) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + text);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="flex items-end gap-2 p-3 bg-white">
      <MicButton 
        onTranscript={handleTranscript} 
        disabled={isBusy} 
        language={i18n.language}
        className="mb-0.5"
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || (isBusy ? 'AI is responding...' : 'Ask a question…')}
        disabled={isBusy}
        rows={1}
        className={cn(
          'flex-1 resize-none rounded-xl border border-[#E5E5DE] bg-[#F8F7F2] px-3.5 py-2 text-sm text-[#202522]',
          'focus:outline-none focus:border-[#315C4A] focus:bg-white',
          'placeholder:text-[#68716B]/70 transition-all',
          isBusy && 'opacity-50 cursor-not-allowed'
        )}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || isBusy}
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          'bg-[#315C4A] text-white transition-all',
          'hover:bg-[#274a3b] active:scale-95 shadow-xs',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100'
        )}
        aria-label="Send message"
      >
        <Send size={15} />
      </button>
    </div>
  );
}
