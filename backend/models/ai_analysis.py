import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, String, Text, text, Boolean
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from database import Base


class AIAnalysis(Base):
    __tablename__ = "ai_analysis"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    petition_id = Column(
        UUID(as_uuid=True),
        ForeignKey("petitions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # One analysis per petition
    )

    category = Column(String, nullable=False)
    department = Column(String, nullable=False)
    priority = Column(String, nullable=False)  # low | medium | high | critical
    is_priority_overridden = Column(Boolean, nullable=False, default=False, server_default=text("false"))
    summary = Column(Text, nullable=False)

    # Stored as JSON arrays — parallel arrays keyed by position
    duplicate_ids = Column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))
    similarity_scores = Column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))

    # Structured explanation block from the LLM
    # {"category_reason": "...", "priority_reason": "...", "department_reason": "..."}
    explanation = Column(JSONB, nullable=False, default=dict, server_default=text("'{}'::jsonb"))

    confidence = Column(Float, nullable=False)
    analyzed_at = Column(DateTime(timezone=True), nullable=False)

    # Relationships
    petition = relationship("Petition", back_populates="ai_analysis")
