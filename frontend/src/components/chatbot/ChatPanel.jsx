/**
 * components/chatbot/ChatPanel.jsx
 *
 * Slide-in panel containing the chat interface.
 * Connects the UI components to the useChat hook.
 */
import { X, Trash2, ShieldCheck } from 'lucide-react';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import { useChat } from '@/hooks/useChat';
import { cn } from '@/lib/utils';

export default function ChatPanel({ isOpen, onClose }) {
  const {
    messages,
    isStreaming,
    isLoadingSession,
    error,
    sendMessage,
    submitFeedback,
    clearMessages,
  } = useChat();

  return (
    <div
      className={cn(
        'fixed bottom-20 right-4 sm:right-6 w-[360px] h-[540px] max-h-[80vh] max-w-[calc(100vw-32px)]',
        'bg-card rounded-2xl shadow-card-hover border border-border flex flex-col overflow-hidden',
        'transition-all duration-300 ease-out z-50 origin-bottom-right',
        isOpen
          ? 'opacity-100 scale-100 translate-y-0'
          : 'opacity-0 scale-95 translate-y-8 pointer-events-none'
      )}
      role="dialog"
      aria-label="InsightGov AI Assistant"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary text-primary-foreground shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-foreground/20">
            <ShieldCheck size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight">InsightGov Assistant</h3>
            <p className="text-[10px] text-primary-foreground/70 uppercase tracking-wider font-medium">AI Powered</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            disabled={isStreaming}
            className="p-1.5 hover:bg-primary-foreground/10 rounded-lg transition-colors disabled:opacity-50 text-primary-foreground/80 hover:text-primary-foreground"
            title="Clear Chat History"
            aria-label="Clear Chat History"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-primary-foreground/10 rounded-lg transition-colors text-primary-foreground/80 hover:text-primary-foreground"
            aria-label="Close chat"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-xs px-4 py-2 border-b border-destructive/20">
          {error}
        </div>
      )}

      {/* Messages Area */}
      {isLoadingSession ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-muted/30">
          <div className="h-6 w-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Connecting to AI...</p>
        </div>
      ) : (
        <ChatMessageList
          messages={messages}
          onSend={sendMessage}
          onFeedback={submitFeedback}
          isStreaming={isStreaming}
        />
      )}

      {/* Input Area */}
      <ChatInput onSend={sendMessage} isStreaming={isStreaming} />
    </div>
  );
}
