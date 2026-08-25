"""
models/chat_message.py

Individual message within a ChatSession.
Stores both user and assistant turns, token counts, and latency for analytics.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # role: "user" | "assistant" | "system" | "summary"
    # "summary" is a special compressed history placeholder
    role = Column(String(16), nullable=False)
    content = Column(Text, nullable=False)

    # Analytics fields — populated on assistant messages
    token_count = Column(Integer, nullable=True)
    llm_model = Column(String(100), nullable=True)
    latency_ms = Column(Integer, nullable=True)

    # Feedback fields
    feedback = Column(String(16), nullable=True)   # "helpful" | "not_helpful" | None
    feedback_text = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    # Relationships
    session = relationship("ChatSession", back_populates="messages")
