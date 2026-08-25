/**
 * components/chatbot/ChatBubble.jsx
 *
 * Individual message bubble. Renders user and assistant messages differently.
 * Supports Markdown rendering for assistant messages.
 * Shows 👍/👎 feedback buttons on completed assistant messages.
 */
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatBubble({ message, onFeedback }) {
  const isUser = message.role === 'user';
  const [feedbackSent, setFeedbackSent] = useState(!!message.feedback);

  const handleFeedback = (rating) => {
    if (feedbackSent || !onFeedback) return;
    setFeedbackSent(true);
    onFeedback(message.id, rating);
  };

  return (
    <div className={cn('flex gap-2 items-end', isUser ? 'justify-end' : 'justify-start')}>
      {/* Avatar for assistant */}
      {!isUser && (
        <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0 mb-1">
          AI
        </div>
      )}

      <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'max-w-[260px] sm:max-w-[300px] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : message.streaming && !message.content ? (
            <div className="flex gap-1.5 items-center py-2 px-1">
              <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce" />
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-0 prose-ul:my-1 prose-li:my-0 text-foreground">
              <ReactMarkdown>{message.content}</ReactMarkdown>
              {message.streaming && (
                <span className="inline-block w-2 h-4 ml-1 -mb-1 bg-muted-foreground/50 animate-pulse rounded-sm" />
              )}
            </div>
          )}
        </div>

        {/* Feedback buttons (assistant only, non-streaming, non-welcome, real DB IDs) */}
        {!isUser && !message.streaming && message.content && message.id !== 'welcome' && !String(message.id).startsWith('assistant-') && (
          <div className="flex gap-1 px-1 mt-1">
            {message.feedback ? (
              <span className="text-xs text-muted-foreground">
                {message.feedback === 'helpful' ? '👍 Thanks!' : '👎 Got it'}
              </span>
            ) : (
              <>
                <button
                  onClick={() => handleFeedback('helpful')}
                  className="p-1 rounded text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-colors"
                  aria-label="Mark as helpful"
                  title="Helpful"
                >
                  <ThumbsUp size={12} />
                </button>
                <button
                  onClick={() => handleFeedback('not_helpful')}
                  className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Mark as not helpful"
                  title="Not helpful"
                >
                  <ThumbsDown size={12} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
