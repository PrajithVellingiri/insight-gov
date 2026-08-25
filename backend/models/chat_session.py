"""
models/chat_session.py

Chat session model. One session per conversation thread.
user_id is nullable to support anonymous (pre-login) visitors.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from database import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,  # NULL = anonymous visitor
    )
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    last_active_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    # Optional: browser locale, entry page, etc. — schema-free future expansion
    metadata_ = Column("metadata", JSONB, nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], lazy="select")
    messages = relationship(
        "ChatMessage",
        back_populates="session",
        lazy="select",
        order_by="ChatMessage.created_at",
    )
