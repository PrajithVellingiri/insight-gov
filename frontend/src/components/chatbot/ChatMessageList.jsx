/**
 * components/chatbot/ChatMessageList.jsx
 *
 * Scrollable list of ChatBubble components.
 * Auto-scrolls to bottom whenever messages change.
 * Shows suggested prompt chips when there's only the welcome message.
 */
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

    // Only auto-scroll if we're already near the bottom (within 150px)
    // or if the assistant just started a new message (streaming is true and the last message is short)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    
    if (isNearBottom || isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isStreaming]);

  const showSuggestions = messages.length <= 1 && !isStreaming;

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3 scroll-smooth">
      {messages.map((msg) => (
        <ChatBubble key={msg.id} message={msg} onFeedback={onFeedback} />
      ))}

      {showSuggestions && (
        <div className="pt-2">
          <p className="text-xs text-muted-foreground text-center mb-2">Suggested questions</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => onSend(prompt)}
                className="text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1.5 hover:bg-primary/20 transition-colors text-left"
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
