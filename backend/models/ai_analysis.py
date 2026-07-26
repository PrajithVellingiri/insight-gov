import uuid

from sqlalchemy import Column, DateTime, Float, ForeignKey, String, Text
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
    summary = Column(Text, nullable=False)

    # Stored as JSON arrays — parallel arrays keyed by position
    duplicate_ids = Column(JSONB, nullable=False, default=list)
    similarity_scores = Column(JSONB, nullable=False, default=list)

    # Structured explanation block from the LLM
    # {"category_reason": "...", "priority_reason": "...", "department_reason": "..."}
    explanation = Column(JSONB, nullable=False, default=dict)

    confidence = Column(Float, nullable=False)
    analyzed_at = Column(DateTime(timezone=True), nullable=False)

    # Relationships
    petition = relationship("Petition", back_populates="ai_analysis")
