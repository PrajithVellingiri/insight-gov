import { X, Trash2, ShieldCheck, Sparkles } from 'lucide-react';
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
        'fixed bottom-24 right-4 sm:right-7 w-[380px] h-[560px] max-h-[82vh] max-w-[calc(100vw-32px)]',
        'glass-panel-elevated rounded-3xl border border-blue-500/30 shadow-2xl flex flex-col overflow-hidden',
        'transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) z-50 origin-bottom-right',
        isOpen
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-95 translate-y-8 pointer-events-none'
      )}
      role="dialog"
      aria-label="InsightGov AI Assistant"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/90 text-foreground shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_0_12px_rgba(37,99,235,0.4)] border border-blue-400/30">
            <ShieldCheck size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight text-foreground flex items-center gap-1.5">
              InsightGov Copilot
            </h3>
            <p className="text-[10px] text-cyan-400 font-mono font-semibold uppercase tracking-wider">Public Policy & FAQ RAG</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            disabled={isStreaming}
            className="p-1.5 hover:bg-slate-800/60 rounded-xl transition-colors disabled:opacity-50 text-muted-foreground hover:text-foreground"
            title="Clear Chat History"
            aria-label="Clear Chat History"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800/60 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-500/10 text-rose-400 text-xs px-4 py-2 border-b border-rose-500/20 font-medium">
          {error}
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-hidden bg-slate-950/40">
        <ChatMessageList
          messages={messages}
          isStreaming={isStreaming}
          isLoadingSession={isLoadingSession}
          onSubmitFeedback={submitFeedback}
        />
      </div>

      {/* Chat Input */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 shrink-0">
        <ChatInput
          onSendMessage={sendMessage}
          disabled={isStreaming || isLoadingSession}
          placeholder="Ask about public schemes, grievance status, or policies..."
        />
      </div>
    </div>
  );
}
