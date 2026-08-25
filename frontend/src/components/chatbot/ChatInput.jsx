/**
 * components/chatbot/ChatInput.jsx
 *
 * Text input + send button for the chat panel.
 * Handles Enter key (send) and Shift+Enter (newline).
 * Disabled while streaming.
 */
import { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import MicButton from '@/components/ui/MicButton';
import { useTranslation } from 'react-i18next';

export default function ChatInput({ onSend, isStreaming }) {
  const { t, i18n } = useTranslation();
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
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
    // Auto-grow textarea
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
    <div className="flex items-end gap-1.5 p-3 border-t border-border bg-card">
      <MicButton 
        onTranscript={handleTranscript} 
        disabled={isStreaming} 
        language={i18n.language}
        className="mb-0.5"
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={isStreaming ? 'AI is responding...' : 'Ask a question…'}
        disabled={isStreaming}
        rows={1}
        className={cn(
          'flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
          'placeholder:text-muted-foreground transition-all',
          isStreaming && 'opacity-50 cursor-not-allowed'
        )}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || isStreaming}
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
          'bg-primary text-primary-foreground transition-all',
          'hover:bg-primary/90 active:scale-95',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100'
        )}
        aria-label="Send message"
      >
        <Send size={15} />
      </button>
    </div>
  );
}
