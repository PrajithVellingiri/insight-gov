import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text, Float, Sequence, Integer, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base

petition_number_seq = Sequence('petition_number_seq')

def generate_petition_number(context):
    seq_val = context.connection.scalar(petition_number_seq)
    return f"IG-PET-{seq_val:06d}"

class Petition(Base):
    __tablename__ = "petitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    petition_number = Column(String, unique=True, index=True, nullable=False, default=generate_petition_number)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_status = Column(String, nullable=False, default="unverified")
    location_source = Column(String, nullable=False, default="manual")
    location_accuracy = Column(Float, nullable=True)

    # Phase 7: Location Integrity
    device_latitude = Column(Float, nullable=True)
    device_longitude = Column(Float, nullable=True)
    device_accuracy = Column(Float, nullable=True)
    location_verification_status = Column(String, nullable=False, default="unverified")
    location_verification_reason = Column(Text, nullable=True)
    location_verified_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, nullable=False, default="pending")
    # status values: pending | analysed | under_review | resolved | rejected | withdrawn

    # Withdrawal (citizen-initiated, only before officer begins review)
    withdrawal_reason = Column(Text, nullable=True)

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
    
    # Phase 3: Department Decision Intelligence
    citizen_department_id = Column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )
    department_match = Column(Boolean, nullable=True)

    officer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_duplicate = Column(Boolean, nullable=False, default=False)
    duplicate_count = Column(Integer, nullable=False, default=0, server_default=text("0"))

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
        "User", foreign_keys=[submitted_by], back_populates="submitted_petitions", lazy="selectin"
    )
    officer = relationship(
        "User", foreign_keys=[officer_id], back_populates="assigned_petitions"
    )
    department = relationship("Department", back_populates="petitions", foreign_keys=[department_id])
    ai_analysis = relationship(
        "AIAnalysis", back_populates="petition", uselist=False, lazy="selectin"
    )
    history = relationship(
        "PetitionHistory", back_populates="petition", lazy="selectin"
    )
    images = relationship(
        "PetitionImage",
        back_populates="petition",
        lazy="selectin",
        order_by="PetitionImage.created_at",
    )
