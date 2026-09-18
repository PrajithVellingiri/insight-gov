"""
schemas/chat.py

Pydantic request/response models for all /chat/* endpoints.
No petition analysis types should ever appear here.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Session
# ---------------------------------------------------------------------------

class SessionCreate(BaseModel):
    """Request body for POST /chat/sessions (currently empty, reserved for future)."""
    pass


class SessionOut(BaseModel):
    session_id: UUID
    created_at: datetime
    is_new: bool

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------

class ChatMessageIn(BaseModel):
    session_id: UUID = Field(..., description="Active chat session ID.")
    message: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="User message (max 1,000 characters).",
    )
    language: str | None = Field(
        None,
        description="Preferred language code for the response.",
    )


class ChatSource(BaseModel):
    title: str
    source: str
    section: str | None = None
    relevance: float | None = None


class ChatMessageOut(BaseModel):
    message_id: UUID
    session_id: UUID
    reply: str
    model: str
    token_count: int | None = None
    sources: list[ChatSource] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class ChatMessageRecord(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    content: str
    token_count: int | None = None
    llm_model: str | None = None
    latency_ms: int | None = None
    feedback: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Conversation History
# ---------------------------------------------------------------------------

class ChatHistoryOut(BaseModel):
    session_id: UUID
    messages: list[ChatMessageRecord]
    total: int


# ---------------------------------------------------------------------------
# Feedback
# ---------------------------------------------------------------------------

class FeedbackIn(BaseModel):
    rating: Literal["helpful", "not_helpful"] = Field(
        ..., description="Thumbs up / thumbs down rating."
    )
    feedback_text: str | None = Field(
        None,
        max_length=500,
        description="Optional written feedback.",
    )


class FeedbackOut(BaseModel):
    message_id: UUID
    rating: str
    updated: bool


# ---------------------------------------------------------------------------
# Analytics (Admin only)
# ---------------------------------------------------------------------------

class ChatAnalyticsOut(BaseModel):
    total_sessions: int
    total_messages: int
    avg_latency_ms: float | None
    total_tokens: int
    helpful_count: int
    not_helpful_count: int
    satisfaction_score: float | None  # helpful / (helpful + not_helpful)
    daily_sessions: list[dict[str, Any]]
