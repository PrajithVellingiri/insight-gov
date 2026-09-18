/**
 * components/chatbot/ChatBubble.jsx
 *
 * Individual message bubble. Renders user and assistant messages differently.
 * Supports Markdown rendering for assistant messages.
 * Displays grounded official sources when available via RAG.
 * Shows 👍/👎 feedback buttons on completed assistant messages.
 */
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ThumbsUp, ThumbsDown, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ChatBubble({ message, onFeedback }) {
  const isUser = message.role === 'user';
  const [feedbackSent, setFeedbackSent] = useState(!!message.feedback);
  const [showSources, setShowSources] = useState(false);

  const handleFeedback = (rating) => {
    if (feedbackSent || !onFeedback) return;
    setFeedbackSent(true);
    onFeedback(message.id, rating);
  };

  const hasSources = !isUser && !message.streaming && message.sources && message.sources.length > 0;

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
            'max-w-[280px] sm:max-w-[340px] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
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

        {/* Grounded Sources Accordion (RAG citations) */}
        {hasSources && (
          <div className="max-w-[280px] sm:max-w-[340px] w-full mt-1">
            <button
              onClick={() => setShowSources((prev) => !prev)}
              className="flex items-center justify-between w-full px-2.5 py-1.5 text-xs font-medium rounded-lg bg-card/80 hover:bg-card border border-border/50 text-muted-foreground hover:text-foreground transition-all duration-150"
              aria-expanded={showSources}
            >
              <div className="flex items-center gap-1.5">
                <BookOpen size={12} className="text-primary" />
                <span>Official Sources ({message.sources.length})</span>
              </div>
              {showSources ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showSources && (
              <div className="mt-1 space-y-1 p-2 rounded-lg bg-card border border-border/60 text-xs shadow-sm animate-in fade-in-50 duration-150">
                {message.sources.map((src, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded bg-muted/40 border border-border/40 flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-foreground truncate">{src.title}</span>
                      {src.relevance !== undefined && src.relevance !== null && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-primary/10 text-primary shrink-0">
                          {Math.round(src.relevance * 100)}% match
                        </span>
                      )}
                    </div>
                    {src.section && src.section !== 'General' && (
                      <span className="text-[11px] text-muted-foreground truncate">
                        Section: {src.section}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Feedback buttons (assistant only, non-streaming, non-welcome, real DB IDs) */}
        {!isUser && !message.streaming && message.content && message.id !== 'welcome' && !String(message.id).startsWith('assistant-') && (
          <div className="flex gap-1 px-1 mt-0.5">
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
