import { useState } from 'react';
import { MessageSquareText, X } from 'lucide-react';
import ChatPanel from './ChatPanel';
import { cn } from '@/lib/utils';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Charcoal Action Button with Orange Signal Dot */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-[60]',
          'flex h-12 w-12 items-center justify-center rounded-md shadow-elevated',
          'bg-[#181817] text-white border border-[#292927]',
          'transition-all duration-150 hover:bg-[#292927] active:scale-95 group'
        )}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F05A3C] opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F05A3C]" />
        </span>
        {isOpen ? (
          <X size={18} />
        ) : (
          <MessageSquareText size={18} />
        )}
      </button>

      {/* Slide-in Civic Intelligence Chat Panel */}
      <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
