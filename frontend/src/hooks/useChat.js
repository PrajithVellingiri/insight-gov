/**
 * hooks/useChat.js
 *
 * Custom hook managing all chatbot state and API interactions.
 *
 * Responsibilities:
 *  - Persist session_id in localStorage across page reloads
 *  - Manage messages array (optimistic user bubbles + streamed assistant replies)
 *  - Handle SSE streaming with live token appending
 *  - Expose sendMessage, clearMessages, submitFeedback
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { createChatSession, streamChatMessage, getChatHistory, submitChatFeedback, clearChatSession } from '@/api/chat.api';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

const SESSION_KEY = 'insightgov_chat_session';

/**
 * @typedef {Object} ChatMessageUI
 * @property {string} id          - Temporary client-side ID or server message_id
 * @property {'user'|'assistant'} role
 * @property {string} content
 * @property {boolean} [streaming] - True while token chunks are being appended
 * @property {string|null} [feedback] - 'helpful' | 'not_helpful' | null
 */

export function useChat() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [error, setError] = useState(null);
  const streamingMsgId = useRef(null);
  const abortControllerRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Session Initialization
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const init = async () => {
      let activeSessionId = null;

      if (user) {
        // Authenticated users: get unified active session from backend
        try {
          const data = await createChatSession();
          activeSessionId = data.session_id;
        } catch (err) {
          setError('Could not start a chat session. Please refresh the page.');
          setIsLoadingSession(false);
          return;
        }
      } else {
        // Anonymous users: use sessionStorage (cleared when browser closes)
        activeSessionId = sessionStorage.getItem(SESSION_KEY);
      }

      if (activeSessionId) {
        setSessionId(activeSessionId);
        try {
          const history = await getChatHistory(activeSessionId, 30);
          if (history?.messages && history.messages.length > 0) {
            setMessages(
              history.messages
                .filter((m) => m.role === 'user' || m.role === 'assistant')
                .map((m) => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  feedback: m.feedback ?? null,
                }))
            );
          } else if (!user) {
            // Empty history for anon user, show welcome message
            _showWelcomeMessage();
          }
        } catch {
          // Session may be expired
          if (!user) {
            await _createNewAnonSession();
          }
        }
      } else if (!user) {
        await _createNewAnonSession();
      }

      // If user is authenticated and history is empty, show welcome message
      if (user && messages.length === 0) {
        setMessages((prev) => {
          if (prev.length === 0) {
            return [{
              id: 'welcome',
              role: 'assistant',
              content: "👋 Hi! I'm the InsightGov AI Assistant. I can help you submit petitions, check petition status, learn about government departments, and navigate the portal.\n\nHow can I help you today?",
              feedback: null,
            }];
          }
          return prev;
        });
      }

      setIsLoadingSession(false);
    };

    init();
    
    // Cleanup dangling stream on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const _createNewAnonSession = async () => {
    try {
      const data = await createChatSession();
      setSessionId(data.session_id);
      sessionStorage.setItem(SESSION_KEY, data.session_id);
      _showWelcomeMessage();
    } catch (err) {
      setError('Could not start a chat session. Please refresh the page.');
    }
  };

  const _showWelcomeMessage = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "👋 Hi! I'm the InsightGov AI Assistant. I can help you submit petitions, check petition status, learn about government departments, and navigate the portal.\n\nHow can I help you today?",
        feedback: null,
      },
    ]);
  };

  // ---------------------------------------------------------------------------
  // Send Message
  // ---------------------------------------------------------------------------

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || isStreaming || !sessionId) return;

      setError(null);

      // Optimistic user bubble
      const userMsgId = `user-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: 'user', content: text.trim(), feedback: null },
      ]);

      // Placeholder assistant bubble (streaming)
      const assistantTempId = `assistant-${Date.now()}`;
      streamingMsgId.current = assistantTempId;
      setMessages((prev) => [
        ...prev,
        { id: assistantTempId, role: 'assistant', content: '', streaming: true, feedback: null },
      ]);

      setIsStreaming(true);

      // Abort any ongoing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      await streamChatMessage(
        sessionId,
        text.trim(),
        i18n.language,
        // onToken
        (token) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantTempId
                ? { ...m, content: m.content + token }
                : m
            )
          );
        },
        // onDone
        (messageId) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantTempId
                ? { ...m, id: messageId ?? assistantTempId, streaming: false }
                : m
            )
          );
          setIsStreaming(false);
          streamingMsgId.current = null;
        },
        // onError
        (errorType) => {
          const errorMessages = {
            auth: 'Authentication failed. Please refresh and try again.',
            timeout: 'The response took too long. Please try again.',
            unavailable: 'The AI assistant is temporarily unavailable. Please try again in a moment.',
            connection: 'Connection failed. Please check your internet and try again.',
          };
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantTempId
                ? {
                    ...m,
                    content: errorMessages[errorType] || 'Something went wrong. Please try again.',
                    streaming: false,
                  }
                : m
            )
          );
          setIsStreaming(false);
          streamingMsgId.current = null;
        },
        abortControllerRef.current.signal
      );
    },
    [sessionId, i18n.language]
  );

  // ---------------------------------------------------------------------------
  // Feedback
  // ---------------------------------------------------------------------------

  const submitFeedback = useCallback(async (messageId, rating, feedbackText = null) => {
    try {
      await submitChatFeedback(messageId, rating, feedbackText);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback: rating } : m))
      );
    } catch {
      // Feedback failure is non-critical
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Clear
  // ---------------------------------------------------------------------------

  const clearMessages = useCallback(async () => {
    try {
      if (sessionId) {
        await clearChatSession(sessionId);
      }
    } catch {
      // Ignore errors during clear
    }
    
    sessionStorage.removeItem(SESSION_KEY);
    setMessages([]);
    setSessionId(null);
    setIsLoadingSession(true);
    
    if (user) {
      // We still need to call createChatSession to get a brand new active session
      try {
        const data = await createChatSession();
        setSessionId(data.session_id);
        _showWelcomeMessage();
      } catch {
        setError('Could not start a new chat session.');
      }
    } else {
      await _createNewAnonSession();
    }
    
    setIsLoadingSession(false);
  }, [sessionId, user]);

  return {
    sessionId,
    messages,
    isStreaming,
    isLoadingSession,
    error,
    sendMessage,
    submitFeedback,
    clearMessages,
  };
}
