import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class PetitionImage(Base):
    """Stores uploaded image metadata for a petition."""

    __tablename__ = "petition_images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    petition_id = Column(
        UUID(as_uuid=True),
        ForeignKey("petitions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    filename = Column(String, nullable=False)       # original filename
    stored_path = Column(String, nullable=False)    # relative path on disk
    mime_type = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)     # bytes
    image_type = Column(String, nullable=False, default="petition")  # "petition" or "resolution"
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    petition = relationship("Petition", back_populates="images")
