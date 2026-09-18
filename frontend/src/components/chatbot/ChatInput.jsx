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
        placeholder={placeholder || (isBusy ? 'Processing query...' : 'Inquire about policy or grievance...')}
        disabled={isBusy}
        rows={1}
        className={cn(
          'flex-1 resize-none rounded-md border border-[#DDDCD7] bg-[#F7F6F2] px-3 py-2 text-xs text-[#181817]',
          'focus:outline-none focus:border-[#F05A3C] focus:bg-white',
          'placeholder:text-[#6F6F6A] transition-colors',
          isBusy && 'opacity-50 cursor-not-allowed'
        )}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || isBusy}
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
          'bg-[#181817] text-white transition-all',
          'hover:bg-[#F05A3C] active:scale-95',
          'disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100'
        )}
        aria-label="Send message"
      >
        <Send size={14} />
      </button>
    </div>
  );
}
