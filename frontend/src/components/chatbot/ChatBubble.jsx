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
      {!isUser && (
        <div className="h-6 w-6 rounded bg-[#181817] text-white flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mb-1">
          IG
        </div>
      )}

      <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'max-w-[280px] sm:max-w-[320px] rounded-md px-3.5 py-2 text-xs leading-relaxed',
            isUser
              ? 'bg-[#181817] text-white'
              : 'bg-white border border-[#DDDCD7] text-[#181817] shadow-subtle'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : message.streaming && !message.content ? (
            <div className="flex gap-1.5 items-center py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F05A3C] animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#F05A3C] animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#F05A3C] animate-bounce" />
            </div>
          ) : (
            <div className="prose prose-xs max-w-none prose-p:my-0 prose-ul:my-1 prose-li:my-0 text-[#181817]">
              <ReactMarkdown>{message.content}</ReactMarkdown>
              {message.streaming && (
                <span className="inline-block w-1 h-3 ml-1 -mb-0.5 bg-[#F05A3C] animate-pulse" />
              )}
            </div>
          )}
        </div>

        {/* Grounded Sources Accordion (RAG citations) */}
        {hasSources && (
          <div className="max-w-[280px] sm:max-w-[320px] w-full mt-1">
            <button
              onClick={() => setShowSources((prev) => !prev)}
              className="flex items-center justify-between w-full px-2 py-1 text-[11px] font-mono rounded bg-white hover:bg-[#F7F6F2] border border-[#DDDCD7] text-[#6F6F6A] hover:text-[#181817] transition-colors"
              aria-expanded={showSources}
            >
              <div className="flex items-center gap-1.5">
                <BookOpen size={11} className="text-[#F05A3C]" />
                <span>Sources ({message.sources.length})</span>
              </div>
              {showSources ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {showSources && (
              <div className="mt-1 space-y-1 p-2 rounded bg-white border border-[#DDDCD7] text-xs">
                {message.sources.map((src, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded bg-[#F7F6F2] border border-[#DDDCD7] flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-[#181817] text-[11px] truncate">{src.title}</span>
                      {src.relevance !== undefined && src.relevance !== null && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#FFF0EB] text-[#F05A3C] shrink-0">
                          {Math.round(src.relevance * 100)}%
                        </span>
                      )}
                    </div>
                    {src.section && src.section !== 'General' && (
                      <span className="text-[10px] text-[#6F6F6A] truncate font-mono">
                        {src.section}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Feedback buttons */}
        {!isUser && !message.streaming && message.content && message.id !== 'welcome' && !String(message.id).startsWith('assistant-') && (
          <div className="flex gap-1 px-1 mt-0.5">
            {message.feedback ? (
              <span className="text-[10px] font-mono text-[#6F6F6A]">
                {message.feedback === 'helpful' ? '✓ Helpful' : 'Noted'}
              </span>
            ) : (
              <>
                <button
                  onClick={() => handleFeedback('helpful')}
                  className="p-1 rounded text-[#6F6F6A] hover:text-[#181817] transition-colors"
                  aria-label="Helpful"
                  title="Helpful"
                >
                  <ThumbsUp size={11} />
                </button>
                <button
                  onClick={() => handleFeedback('not_helpful')}
                  className="p-1 rounded text-[#6F6F6A] hover:text-[#E13B22] transition-colors"
                  aria-label="Not helpful"
                  title="Not helpful"
                >
                  <ThumbsDown size={11} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
