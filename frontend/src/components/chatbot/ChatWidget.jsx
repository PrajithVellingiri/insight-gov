import { useState } from 'react';
import { MessageSquareText, Sparkles } from 'lucide-react';
import ChatPanel from './ChatPanel';
import { cn } from '@/lib/utils';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating 3D Action Orb */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-[60]',
          'flex h-14 w-14 items-center justify-center rounded-2xl shadow-[0_8px_25px_rgba(37,99,235,0.4)]',
          'bg-gradient-to-br from-blue-500 to-blue-700 text-white border border-blue-400/40',
          'transition-all duration-300 hover:scale-105 active:scale-95 group'
        )}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
        </span>
        <MessageSquareText size={24} className="drop-shadow-sm transition-transform duration-300 group-hover:scale-110" />
      </button>

      {/* Slide-in Glassmorphic Chat Panel */}
      <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
