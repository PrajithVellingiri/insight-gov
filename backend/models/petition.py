import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class Petition(Base):
    __tablename__ = "petitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")
    # status values: pending | analysed | under_review | resolved | rejected

    submitted_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    department_id = Column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )
    officer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_duplicate = Column(Boolean, nullable=False, default=False)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    citizen = relationship(
        "User", foreign_keys=[submitted_by], back_populates="submitted_petitions"
    )
    officer = relationship(
        "User", foreign_keys=[officer_id], back_populates="assigned_petitions"
    )
    department = relationship("Department", back_populates="petitions")
    ai_analysis = relationship(
        "AIAnalysis", back_populates="petition", uselist=False, lazy="select"
    )
    history = relationship(
        "PetitionHistory", back_populates="petition", lazy="select"
    )
