/**
 * components/chatbot/ChatWidget.jsx
 *
 * Floating Action Button (FAB) and container for the ChatPanel.
 * Placed globally via PageWrapper or LandingPage.
 */
import { useState } from 'react';
import { MessageSquareText } from 'lucide-react';
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
          'fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60]',
          'flex h-14 w-14 items-center justify-center rounded-full shadow-card',
          'bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95 hover:bg-primary/90'
        )}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        <MessageSquareText size={24} />
      </button>

      {/* Slide-in Chat Panel */}
      <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
