import { X, Trash2 } from 'lucide-react';
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
        'fixed bottom-20 right-4 sm:right-7 w-[390px] h-[560px] max-h-[82vh] max-w-[calc(100vw-32px)]',
        'bg-[#F7F6F2] rounded-md border border-[#DDDCD7] shadow-elevated flex flex-col overflow-hidden',
        'transition-all duration-200 z-50 origin-bottom-right',
        isOpen
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-95 translate-y-6 pointer-events-none'
      )}
      role="dialog"
      aria-label="InsightGov AI Assistant"
    >
      {/* Header: Charcoal */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#181817] text-white border-b border-[#292927] shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[#F05A3C]" />
          <div>
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-white">
              INSIGHTGOV COPILOT
            </h3>
            <p className="text-[10px] text-[#A3A39E] font-mono">
              Public Policy & Schemes FAQ
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearMessages}
            disabled={isStreaming}
            className="p-1 hover:bg-[#292927] rounded text-[#A3A39E] hover:text-white transition-colors disabled:opacity-40"
            title="Clear Chat History"
            aria-label="Clear Chat History"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#292927] rounded text-[#A3A39E] hover:text-white transition-colors"
            aria-label="Close chat"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-[#FFF0EB] text-[#E13B22] text-xs px-4 py-2 border-b border-[#F05A3C]/30 font-mono">
          {error}
        </div>
      )}

      {/* Message List */}
      <div className="flex-1 overflow-hidden bg-[#F7F6F2] flex flex-col">
        <ChatMessageList
          messages={messages}
          isStreaming={isStreaming}
          isLoadingSession={isLoadingSession}
          onSend={sendMessage}
          onFeedback={submitFeedback}
        />
      </div>

      {/* Chat Input */}
      <div className="border-t border-[#DDDCD7] bg-white shrink-0">
        <ChatInput
          onSend={sendMessage}
          isStreaming={isStreaming || isLoadingSession}
          placeholder="Ask about public schemes, status, or policy..."
        />
      </div>
    </div>
  );
}
