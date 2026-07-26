import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # citizen | officer | admin
    department_id = Column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    department = relationship("Department", back_populates="users", lazy="selectin")
    submitted_petitions = relationship(
        "Petition",
        foreign_keys="Petition.submitted_by",
        back_populates="citizen",
        lazy="select",
    )
    assigned_petitions = relationship(
        "Petition",
        foreign_keys="Petition.officer_id",
        back_populates="officer",
        lazy="select",
    )
    notifications = relationship("Notification", back_populates="user", lazy="select")
    petition_history = relationship(
        "PetitionHistory", back_populates="officer", lazy="select"
    )
