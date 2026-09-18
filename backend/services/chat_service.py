"""
services/chat_service.py

Orchestrates the full chatbot lifecycle:
  - Session management (create, retrieve, expire)
  - Conversation history retrieval with rolling context window
  - Conversation compression when history exceeds threshold
  - Tool calling for live data injection
  - RAG context retrieval
  - Provider delegation (via ChatProvider interface)
  - Message persistence (both user and assistant turns)
  - Feedback recording
  - Analytics aggregation

ISOLATION GUARANTEE: This service has zero imports from:
  - petition_service.py
  - ai_client.py
  - Any module in the /ai folder
  - Any ChromaDB petition collection
"""
from __future__ import annotations

import json
import logging
import re
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import AsyncGenerator
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from config import settings
from models.chat_message import ChatMessage
from models.chat_session import ChatSession
from schemas.chat import (
    ChatAnalyticsOut,
    ChatHistoryOut,
    ChatMessageOut,
    ChatMessageRecord,
    FeedbackOut,
)
from services.chat_providers import ChatMessage as LLMMessage
from services.chat_providers import ChatProvider
from services.chat_tools import ChatTools
from services.rag_service import get_rag_service

logger = logging.getLogger(__name__)

# Path to the system prompt markdown file
_PROMPT_PATH = Path(__file__).parent.parent / "prompts" / "chatbot_system.md"


def _load_system_prompt() -> str:
    """Load system prompt from Markdown file. Falls back to a minimal inline prompt."""
    try:
        return _PROMPT_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        logger.warning("chatbot_system.md not found. Using fallback prompt.")
        return (
            "You are InsightGov AI Assistant. Help citizens with the InsightGov "
            "Tamil Nadu government petition portal. Never categorize petitions or "
            "predict departments — that is handled by the local AI pipeline."
        )


_SYSTEM_PROMPT = _load_system_prompt()


def _detect_tool_intent(message: str) -> tuple[str | None, str | None]:
    """
    Simple keyword-based tool intent detection.

    Returns (tool_name, argument) or (None, None) if no tool needed.
    This replaces a heavyweight function-calling setup while maintaining
    the same architectural pattern. Phase 2 can swap this for proper
    OpenAI function calling format if Grok supports it.
    """
    msg_lower = message.lower()

    # Petition status / timeline patterns
    uuid_pattern = re.compile(
        r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
        re.IGNORECASE,
    )
    uuid_match = uuid_pattern.search(message)

    if uuid_match and any(kw in msg_lower for kw in ["status", "petition", "where", "timeline", "history", "update"]):
        petition_id = uuid_match.group(0)
        if "timeline" in msg_lower or "history" in msg_lower:
            return "get_petition_timeline", petition_id
        return "get_petition_status", petition_id

    # Notification summary
    if any(kw in msg_lower for kw in ["notification", "unread", "alerts", "updates"]):
        return "get_notification_summary", None

    # Department info
    if any(kw in msg_lower for kw in ["department", "departments", "which dept", "who handles"]):
        return "get_department_info", None

    # FAQ / how-to
    if any(kw in msg_lower for kw in ["how to", "how do i", "how can i", "submit", "duplicate", "officer", "status"]):
        return "get_faq_context", msg_lower

    return None, None


class ChatService:
    """
    Chatbot session and messaging orchestrator.

    Dependencies:
      - db: SQLAlchemy session (for chat tables + read-only petition/dept data)
      - provider: ChatProvider (injected, defaults to GrokProvider)
    """

    def __init__(self, db: Session, provider: ChatProvider) -> None:
        self._db = db
        self._provider = provider
        self._tools = ChatTools(db)
        self._rag = get_rag_service()

    # -------------------------------------------------------------------
    # Session Management
    # -------------------------------------------------------------------

    def get_or_create_session(
        self, user_id: UUID | None = None
    ) -> tuple[ChatSession, bool]:
        """
        Returns an existing active session for the user, or creates a new one.
        Returns (session, is_new).
        """
        if user_id:
            existing = (
                self._db.query(ChatSession)
                .filter(
                    ChatSession.user_id == user_id,
                    ChatSession.is_active.is_(True),
                )
                .order_by(ChatSession.last_active_at.desc())
                .first()
            )
            if existing:
                return existing, False

        session = ChatSession(user_id=user_id)
        self._db.add(session)
        self._db.commit()
        self._db.refresh(session)
        logger.info("New chat session %s created (user=%s).", session.id, user_id)
        return session, True

    def get_session(self, session_id: UUID, user_id: UUID | None = None) -> ChatSession | None:
        query = self._db.query(ChatSession).filter(
            ChatSession.id == session_id, ChatSession.is_active.is_(True)
        )
        if user_id:
            query = query.filter(ChatSession.user_id == user_id)
        return query.first()

    def _touch_session(self, session: ChatSession) -> None:
        session.last_active_at = datetime.now(timezone.utc)
        self._db.commit()

    def deactivate_session(self, session_id: UUID, user_id: UUID | None = None) -> None:
        """Mark a session as inactive (effectively clearing it for the user while preserving analytics)."""
        session = self.get_session(session_id, user_id=user_id)
        if not session:
            raise ValueError("Chat session not found or unauthorized.")
        
        # If user_id is provided, ensure they own the session
        if user_id and session.user_id != user_id:
            raise ValueError("Access denied.")
            
        session.is_active = False
        self._db.commit()
        logger.info("Chat session %s deactivated.", session_id)

    def expire_old_sessions(self) -> int:
        """Mark sessions inactive after TTL. Called by a periodic task."""
        cutoff = datetime.now(timezone.utc) - timedelta(
            hours=settings.chat_session_ttl_hours
        )
        count = (
            self._db.query(ChatSession)
            .filter(
                ChatSession.is_active.is_(True),
                ChatSession.last_active_at < cutoff,
            )
            .update({"is_active": False})
        )
        self._db.commit()
        if count:
            logger.info("Expired %d stale chat sessions.", count)
        return count

    # -------------------------------------------------------------------
    # History & Context Window
    # -------------------------------------------------------------------

    def _get_history(self, session_id: UUID) -> list[ChatMessage]:
        return (
            self._db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )

    def _build_context_messages(
        self, all_messages: list[ChatMessage]
    ) -> list[LLMMessage]:
        """
        Applies rolling window to limit context to N turns.
        Preserves any 'summary' message as the anchor point.
        """
        window = settings.chat_context_window
        # Find last summary message — use it as context floor
        summary_idx = -1
        for i, msg in enumerate(all_messages):
            if msg.role == "summary":
                summary_idx = i

        if summary_idx >= 0:
            # Keep summary + messages after it within the window
            tail = all_messages[summary_idx:]
        else:
            tail = all_messages

        # Apply rolling window (N turns = 2*N messages: user+assistant)
        max_messages = window * 2
        trimmed = tail[-max_messages:] if len(tail) > max_messages else tail

        result = []
        for msg in trimmed:
            role = "user" if msg.role == "user" else "assistant"
            if msg.role == "summary":
                role = "assistant"
            result.append(LLMMessage(role=role, content=msg.content))
        return result

    # -------------------------------------------------------------------
    # Conversation Compression
    # -------------------------------------------------------------------

    def _maybe_compress(self, session_id: UUID) -> None:
        """
        If message count exceeds threshold, summarize older messages.
        Replaces them with a single 'summary' role message.
        """
        threshold = settings.chat_compression_threshold * 2  # turns → messages
        all_msgs = self._get_history(session_id)
        if len(all_msgs) <= threshold:
            return

        # Compress everything except the last window's worth
        window_size = settings.chat_context_window * 2
        msgs_to_compress = all_msgs[:-window_size]
        if not msgs_to_compress:
            return

        # Build a simple summary text from the old messages
        summary_lines = []
        for msg in msgs_to_compress:
            if msg.role in ("user", "assistant"):
                tag = "User" if msg.role == "user" else "Assistant"
                summary_lines.append(f"{tag}: {msg.content[:200]}")

        summary_text = (
            "[Conversation summary from earlier turns]\n"
            + "\n".join(summary_lines[-20:])  # cap at 20 lines
        )

        # Delete old messages and insert summary
        for msg in msgs_to_compress:
            self._db.delete(msg)

        summary_msg = ChatMessage(
            session_id=session_id,
            role="summary",
            content=summary_text,
        )
        self._db.add(summary_msg)
        self._db.commit()
        logger.info(
            "Compressed %d messages into summary for session %s.",
            len(msgs_to_compress),
            session_id,
        )

    # -------------------------------------------------------------------
    # Tool Calling
    # -------------------------------------------------------------------

    def _execute_tool(
        self,
        tool_name: str,
        argument: str | None,
        user_id: UUID | None,
    ) -> str:
        """
        Execute a tool function and return a formatted string for LLM injection.
        Returns empty string if tool not applicable.
        """
        try:
            if tool_name == "get_petition_status" and argument:
                result = self._tools.get_petition_status(argument, user_id or UUID(int=0))
            elif tool_name == "get_petition_timeline" and argument:
                result = self._tools.get_petition_timeline(argument)
            elif tool_name == "get_department_info":
                result = self._tools.get_department_info(argument)
            elif tool_name == "get_notification_summary" and user_id:
                result = self._tools.get_notification_summary(user_id)
            elif tool_name == "get_faq_context" and argument:
                return self._tools.get_faq_context(argument)
            elif tool_name == "get_user_profile" and user_id:
                result = self._tools.get_user_profile(user_id)
            else:
                return ""

            return f"\n\n[Live Data]\n{json.dumps(result, indent=2, default=str)}\n"
        except Exception as exc:
            logger.error("Tool %s failed: %s", tool_name, exc)
            return ""

    # -------------------------------------------------------------------
    # Message Persistence
    # -------------------------------------------------------------------

    def _save_message(
        self,
        session_id: UUID,
        role: str,
        content: str,
        token_count: int | None = None,
        llm_model: str | None = None,
        latency_ms: int | None = None,
    ) -> ChatMessage:
        msg = ChatMessage(
            session_id=session_id,
            role=role,
            content=content,
            token_count=token_count,
            llm_model=llm_model,
            latency_ms=latency_ms,
        )
        self._db.add(msg)
        self._db.commit()
        self._db.refresh(msg)
        return msg

    # -------------------------------------------------------------------
    # Send Message (non-streaming)
    # -------------------------------------------------------------------

    async def send_message(
        self,
        session_id: UUID,
        user_message: str,
        language: str | None = None,
        user_id: UUID | None = None,
    ) -> ChatMessageOut:
        """Full (non-streaming) message send and response."""
        session = self.get_session(session_id, user_id=user_id)
        if not session:
            raise ValueError("Session not found or unauthorized.")

        # Persist user message
        self._save_message(session_id, "user", user_message)

        # Compress history if needed
        self._maybe_compress(session_id)

        # Build LLM messages from history
        all_msgs = self._get_history(session_id)
        context_messages = self._build_context_messages(all_msgs)

        # Tool calling
        tool_name, tool_arg = _detect_tool_intent(user_message)
        tool_context = ""
        if tool_name:
            tool_context = self._execute_tool(tool_name, tool_arg, user_id)

        rag_context, rag_sources = await self._rag.build_context_block(user_message)

        # Build enriched system prompt
        allowed_languages = {"en", "es", "fr", "hi", "ta", "te"}
        safe_lang = language if language in allowed_languages else "en"
        lang_instruction = f"\n\n[CRITICAL] You must reply entirely in the following language code: {safe_lang}. Do not use English unless the code is 'en'."
        system_base = _load_system_prompt()
        enriched_prompt = system_base + lang_instruction + rag_context + tool_context

        # Call provider
        start = time.monotonic()
        response = await self._provider.chat(
            messages=context_messages,
            system_prompt=enriched_prompt,
            max_tokens=settings.chat_max_tokens,
            temperature=settings.chat_temperature,
        )
        latency_ms = int((time.monotonic() - start) * 1000)

        # Persist assistant response
        total_tokens = response.input_tokens + response.output_tokens
        assistant_msg = self._save_message(
            session_id,
            "assistant",
            response.content,
            token_count=total_tokens,
            llm_model=response.model,
            latency_ms=latency_ms,
        )

        self._touch_session(session)

        return ChatMessageOut(
            message_id=assistant_msg.id,
            session_id=session_id,
            reply=response.content,
            model=response.model,
            token_count=total_tokens,
            sources=[ChatSource(**s) for s in rag_sources],
        )

    # -------------------------------------------------------------------
    # Stream Message
    # -------------------------------------------------------------------

    async def stream_message(
        self,
        session_id: UUID,
        user_message: str,
        language: str | None = None,
        user_id: UUID | None = None,
    ) -> AsyncGenerator[str, None]:
        """
        Streaming message send. Yields SSE-formatted strings.
        The caller (router) wraps these in 'data: ...\n\n' format.
        """
        session = self.get_session(session_id, user_id=user_id)
        if not session:
            yield json.dumps({"error": "Session not found or unauthorized.", "done": True})
            return
            
        print("[2] Session loaded", flush=True)

        # Persist user message
        self._save_message(session_id, "user", user_message)
        self._maybe_compress(session_id)

        all_msgs = self._get_history(session_id)
        context_messages = self._build_context_messages(all_msgs)

        print("[3] Tool calling started", flush=True)
        tool_name, tool_arg = _detect_tool_intent(user_message)
        tool_context = self._execute_tool(tool_name, tool_arg, user_id) if tool_name else ""
        print("[4] Tool calling completed", flush=True)
        rag_context, rag_sources = await self._rag.build_context_block(user_message)
        allowed_languages = {"en", "es", "fr", "hi", "ta", "te"}
        safe_lang = language if language in allowed_languages else "en"
        lang_instruction = f"\n\n[CRITICAL] You must reply entirely in the following language code: {safe_lang}. Do not use English unless the code is 'en'."
        system_base = _load_system_prompt()
        enriched_prompt = system_base + lang_instruction + rag_context + tool_context

        full_response = []
        start = time.monotonic()

        async for token in self._provider.stream_chat(
            messages=context_messages,
            system_prompt=enriched_prompt,
            max_tokens=settings.chat_max_tokens,
            temperature=settings.chat_temperature,
        ):
            if token == "[DONE]":
                break
            if token.startswith("[ERROR:"):
                error_type = token[7:-1]
                yield json.dumps({"error": error_type, "done": True})
                return
            full_response.append(token)
            yield json.dumps({"token": token})

        latency_ms = int((time.monotonic() - start) * 1000)
        complete_text = "".join(full_response)

        # Persist complete assistant response
        assistant_msg = self._save_message(
            session_id,
            "assistant",
            complete_text,
            llm_model=self._provider.model_name,
            latency_ms=latency_ms,
        )

        self._touch_session(session)
        yield json.dumps({
            "done": True,
            "message_id": str(assistant_msg.id),
            "sources": rag_sources,
        })

    # -------------------------------------------------------------------
    # History
    # -------------------------------------------------------------------

    def get_history(self, session_id: UUID, limit: int = 50) -> ChatHistoryOut:
        messages = (
            self._db.query(ChatMessage)
            .filter(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
            .limit(limit)
            .all()
        )
        total = (
            self._db.query(func.count(ChatMessage.id))
            .filter(ChatMessage.session_id == session_id)
            .scalar()
        )
        return ChatHistoryOut(
            session_id=session_id,
            messages=[ChatMessageRecord.model_validate(m) for m in messages],
            total=total,
        )

    # -------------------------------------------------------------------
    # Feedback
    # -------------------------------------------------------------------

    def record_feedback(
        self, message_id: UUID, rating: str, feedback_text: str | None
    ) -> FeedbackOut:
        msg = (
            self._db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
        )
        if not msg:
            raise ValueError(f"Message {message_id} not found.")

        msg.feedback = rating
        msg.feedback_text = feedback_text
        self._db.commit()

        return FeedbackOut(message_id=message_id, rating=rating, updated=True)

    # -------------------------------------------------------------------
    # Analytics
    # -------------------------------------------------------------------

    def get_analytics(self) -> ChatAnalyticsOut:
        total_sessions = self._db.query(func.count(ChatSession.id)).scalar() or 0
        total_messages = self._db.query(func.count(ChatMessage.id)).scalar() or 0

        avg_latency = (
            self._db.query(func.avg(ChatMessage.latency_ms))
            .filter(
                ChatMessage.role == "assistant",
                ChatMessage.latency_ms.isnot(None),
            )
            .scalar()
        )

        total_tokens = (
            self._db.query(func.sum(ChatMessage.token_count))
            .filter(ChatMessage.token_count.isnot(None))
            .scalar()
            or 0
        )

        helpful = (
            self._db.query(func.count(ChatMessage.id))
            .filter(ChatMessage.feedback == "helpful")
            .scalar()
            or 0
        )
        not_helpful = (
            self._db.query(func.count(ChatMessage.id))
            .filter(ChatMessage.feedback == "not_helpful")
            .scalar()
            or 0
        )

        total_rated = helpful + not_helpful
        satisfaction = round(helpful / total_rated, 2) if total_rated > 0 else None

        # Daily sessions (last 7 days)
        from datetime import timedelta
        from collections import Counter
        recent_sessions = (
            self._db.query(ChatSession.created_at)
            .filter(
                ChatSession.created_at
                >= datetime.now(timezone.utc) - timedelta(days=7)
            )
            .all()
        )
        date_counts = Counter(
            s.created_at.strftime("%Y-%m-%d") for s in recent_sessions
        )
        daily_sessions = [
            {"date": d, "count": c} for d, c in sorted(date_counts.items())
        ]

        return ChatAnalyticsOut(
            total_sessions=total_sessions,
            total_messages=total_messages,
            avg_latency_ms=round(float(avg_latency), 1) if avg_latency else None,
            total_tokens=total_tokens,
            helpful_count=helpful,
            not_helpful_count=not_helpful,
            satisfaction_score=satisfaction,
            daily_sessions=daily_sessions,
        )
