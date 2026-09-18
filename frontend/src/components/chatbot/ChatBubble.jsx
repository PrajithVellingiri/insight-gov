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
        <div className="h-7 w-7 rounded-lg bg-[#EFF4F0] border border-[#D4E2D8] flex items-center justify-center text-[#315C4A] text-[11px] font-bold shrink-0 mb-1">
          IG
        </div>
      )}

      <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'max-w-[280px] sm:max-w-[340px] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'bg-[#315C4A] text-white rounded-br-sm'
              : 'bg-white border border-[#E5E5DE] text-[#202522] rounded-bl-sm shadow-xs'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : message.streaming && !message.content ? (
            <div className="flex gap-1.5 items-center py-2 px-1">
              <span className="h-2 w-2 rounded-full bg-[#78917F] animate-bounce [animation-delay:-0.3s]" />
              <span className="h-2 w-2 rounded-full bg-[#78917F] animate-bounce [animation-delay:-0.15s]" />
              <span className="h-2 w-2 rounded-full bg-[#78917F] animate-bounce" />
            </div>
          ) : (
            <div className="prose prose-sm max-w-none prose-p:my-0 prose-ul:my-1 prose-li:my-0 text-[#202522]">
              <ReactMarkdown>{message.content}</ReactMarkdown>
              {message.streaming && (
                <span className="inline-block w-1.5 h-3.5 ml-1 -mb-0.5 bg-[#315C4A] animate-pulse rounded-xs" />
              )}
            </div>
          )}
        </div>

        {/* Grounded Sources Accordion (RAG citations) */}
        {hasSources && (
          <div className="max-w-[280px] sm:max-w-[340px] w-full mt-1">
            <button
              onClick={() => setShowSources((prev) => !prev)}
              className="flex items-center justify-between w-full px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-[#F8F7F2] border border-[#E5E5DE] text-[#68716B] hover:text-[#202522] transition-all duration-150 shadow-xs"
              aria-expanded={showSources}
            >
              <div className="flex items-center gap-1.5">
                <BookOpen size={12} className="text-[#315C4A]" />
                <span>Official Sources ({message.sources.length})</span>
              </div>
              {showSources ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showSources && (
              <div className="mt-1 space-y-1 p-2 rounded-lg bg-white border border-[#E5E5DE] text-xs shadow-xs">
                {message.sources.map((src, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-[#F8F7F2] border border-[#E5E5DE]/70 flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-[#202522] truncate">{src.title}</span>
                      {src.relevance !== undefined && src.relevance !== null && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-[#EFF4F0] text-[#315C4A] shrink-0 font-mono">
                          {Math.round(src.relevance * 100)}% match
                        </span>
                      )}
                    </div>
                    {src.section && src.section !== 'General' && (
                      <span className="text-[11px] text-[#68716B] truncate">
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
              <span className="text-xs text-[#68716B]">
                {message.feedback === 'helpful' ? '✓ Helpful' : 'Noted'}
              </span>
            ) : (
              <>
                <button
                  onClick={() => handleFeedback('helpful')}
                  className="p-1 rounded text-[#68716B] hover:text-[#315C4A] hover:bg-[#EFF4F0] transition-colors"
                  aria-label="Mark as helpful"
                  title="Helpful"
                >
                  <ThumbsUp size={12} />
                </button>
                <button
                  onClick={() => handleFeedback('not_helpful')}
                  className="p-1 rounded text-[#68716B] hover:text-[#9E4343] hover:bg-[#FDF2F2] transition-colors"
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
