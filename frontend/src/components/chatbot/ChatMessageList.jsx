import { useEffect, useRef } from 'react';
import ChatBubble from './ChatBubble';

const SUGGESTED_PROMPTS = [
  'How do I submit an application?',
  'What does "Under Review" mean?',
  'Which department handles road infrastructure?',
  'How does duplicate cluster detection work?',
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
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#6F6F6A] text-center mb-2.5">
            Suggested Inquiries
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => onSend && onSend(prompt)}
                className="text-xs font-mono bg-white text-[#181817] border border-[#DDDCD7] rounded px-3 py-1 hover:border-[#F05A3C] hover:text-[#F05A3C] transition-all text-left"
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
