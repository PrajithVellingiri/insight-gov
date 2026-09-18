import { useState } from 'react';
import { MessageSquareText, X } from 'lucide-react';
import ChatPanel from './ChatPanel';
import { cn } from '@/lib/utils';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-[60]',
          'flex h-13 w-13 p-3.5 items-center justify-center rounded-2xl shadow-lg',
          'bg-[#315C4A] text-white border border-[#274a3b]',
          'transition-all duration-200 hover:bg-[#274a3b] hover:shadow-xl active:scale-95 group'
        )}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#78917F] opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#315C4A] border-2 border-white" />
        </span>
        {isOpen ? (
          <X size={22} className="transition-transform duration-200" />
        ) : (
          <MessageSquareText size={22} className="transition-transform duration-200 group-hover:scale-105" />
        )}
      </button>

      {/* Slide-in Clean Chat Panel */}
      <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
