/**
 * api/chat.api.js
 *
 * Axios wrappers and raw fetch helpers for all /chat/* backend endpoints.
 *
 * IMPORTANT: The streaming endpoint uses the native fetch() API (not Axios)
 * because the browser's EventSource API doesn't support POST requests.
 */
import api from './axiosInstance';

const BASE = import.meta.env.VITE_API_BASE_URL;

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

export const createChatSession = () =>
  api.post('/chat/sessions', {}).then((r) => r.data);

export const clearChatSession = (sessionId) =>
  api.delete(`/chat/sessions/${sessionId}`).then((r) => r.data);

// ---------------------------------------------------------------------------
// Message (non-streaming)
// ---------------------------------------------------------------------------

export const sendChatMessage = (sessionId, message) =>
  api.post('/chat/message', { session_id: sessionId, message }).then((r) => r.data);

// ---------------------------------------------------------------------------
// Streaming (native fetch — required for POST + SSE)
// ---------------------------------------------------------------------------

/**
 * Streams a chat message response. Calls onToken(token) for each SSE token,
 * onDone(messageId) on completion, and onError(errorType) on failure.
 *
 * @param {string} sessionId
 * @param {string} message
 * @param {string} language - language code (e.g. 'en', 'ta')
 * @param {function} onToken - called with each string token
 * @param {function} onDone  - called with messageId when complete
 * @param {function} onError - called with error type string
 * @param {AbortSignal} [abortSignal] - Optional signal to abort the fetch request
 */
export async function streamChatMessage(sessionId, message, language, onToken, onDone, onError, abortSignal) {
  const token = localStorage.getItem('insightgov_token');

  const response = await fetch(`${BASE}/chat/message/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ session_id: sessionId, message, language }),
    signal: abortSignal,
  });

  if (!response.ok || !response.body) {
    if (abortSignal?.aborted) return;
    onError('connection');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = '';
  while (true) {
    try {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
    } catch (err) {
      if (err.name === 'AbortError') return;
      onError('connection');
      break;
    }
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? ''; // keep partial line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;

      const raw = trimmed.slice(5).trim();
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw);
        if (parsed.error) {
          onError(parsed.error);
          return;
        }
        if (parsed.done) {
          onDone(parsed.message_id ?? null);
          return;
        }
        if (parsed.token) {
          onToken(parsed.token);
        }
      } catch {
        // Malformed SSE line — skip
      }
    }
  }
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export const getChatHistory = (sessionId, limit = 50) =>
  api.get('/chat/history', { params: { session_id: sessionId, limit } }).then((r) => r.data);

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export const submitChatFeedback = (messageId, rating, feedbackText = null) =>
  api
    .post(`/chat/feedback/${messageId}`, { rating, feedback_text: feedbackText })
    .then((r) => r.data);

// ---------------------------------------------------------------------------
// Admin Analytics
// ---------------------------------------------------------------------------

export const getChatAnalytics = () =>
  api.get('/chat/analytics').then((r) => r.data);
