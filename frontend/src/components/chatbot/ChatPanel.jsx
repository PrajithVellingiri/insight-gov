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
        'fixed bottom-22 right-4 sm:right-7 w-[390px] h-[580px] max-h-[82vh] max-w-[calc(100vw-32px)]',
        'bg-white rounded-2xl border border-[#E5E5DE] shadow-2xl flex flex-col overflow-hidden',
        'transition-all duration-200 z-50 origin-bottom-right',
        isOpen
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-95 translate-y-6 pointer-events-none'
      )}
      role="dialog"
      aria-label="InsightGov AI Assistant"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E5DE] bg-[#F8F7F2] text-[#202522] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF4F0] border border-[#D4E2D8] text-[#315C4A]">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight text-[#202522]">
              InsightGov Copilot
            </h3>
            <p className="text-[10px] text-[#68716B] font-mono font-medium uppercase tracking-wider">
              Public Policy & Schemes FAQ
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            disabled={isStreaming}
            className="p-1.5 hover:bg-[#E5E5DE]/60 rounded-lg transition-colors disabled:opacity-40 text-[#68716B] hover:text-[#202522]"
            title="Clear Chat History"
            aria-label="Clear Chat History"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#E5E5DE]/60 rounded-lg transition-colors text-[#68716B] hover:text-[#202522]"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-[#FDF2F2] text-[#9E4343] text-xs px-4 py-2 border-b border-[#F5C2C2] font-medium">
          {error}
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-hidden bg-[#F8F7F2]/40 flex flex-col">
        <ChatMessageList
          messages={messages}
          isStreaming={isStreaming}
          isLoadingSession={isLoadingSession}
          onSend={sendMessage}
          onFeedback={submitFeedback}
        />
      </div>

      {/* Chat Input */}
      <div className="border-t border-[#E5E5DE] bg-white shrink-0">
        <ChatInput
          onSend={sendMessage}
          isStreaming={isStreaming || isLoadingSession}
          placeholder="Ask about public schemes, grievance status, or policies..."
        />
      </div>
    </div>
  );
}
