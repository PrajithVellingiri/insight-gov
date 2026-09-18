import { useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';

const SUGGESTED_PROMPTS = [
  'How do I submit a petition?',
  'What does "Under Review" mean?',
  'Which department handles road issues?',
  'How does duplicate detection work?',
];

export default function ChatMessageList({ messages, onSend, onFeedback, isStreaming }) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (isNearBottom || isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  const showSuggestions = messages.length <= 1 && !isStreaming;

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 scroll-smooth">
      {messages.map((msg) => (
        <ChatBubble key={msg.id} message={msg} onFeedback={onFeedback} />
      ))}

      {showSuggestions && (
        <div className="pt-3 pb-1">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#68716B] text-center mb-2.5">
            Suggested Inquiries
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => onSend && onSend(prompt)}
                className="text-xs bg-white text-[#202522] border border-[#E5E5DE] rounded-full px-3 py-1.5 hover:border-[#315C4A] hover:bg-[#EFF4F0] hover:text-[#315C4A] transition-all text-left shadow-xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
