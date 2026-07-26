import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class PetitionHistory(Base):
    __tablename__ = "petition_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    petition_id = Column(
        UUID(as_uuid=True),
        ForeignKey("petitions.id", ondelete="CASCADE"),
        nullable=False,
    )
    officer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    old_status = Column(String, nullable=True)
    new_status = Column(String, nullable=False)
    note = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    petition = relationship("Petition", back_populates="history")
    officer = relationship("User", back_populates="petition_history", lazy="selectin")
