import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_code = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    users = relationship("User", back_populates="department", lazy="select")
    petitions = relationship("Petition", back_populates="department", foreign_keys="[Petition.department_id]", lazy="select")
