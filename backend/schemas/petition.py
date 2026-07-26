from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


class PetitionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=256)
    description: str = Field(..., min_length=10)
    location: str = Field(..., min_length=1, max_length=256)


class PetitionOut(BaseModel):
    id: UUID
    title: str
    description: str
    location: str
    status: str
    submitted_by: UUID
    department_id: UUID | None
    officer_id: UUID | None
    is_duplicate: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AIAnalysisOut(BaseModel):
    id: UUID
    petition_id: UUID
    category: str
    department: str
    priority: Literal["low", "medium", "high", "critical"]
    summary: str
    duplicate_ids: list[str]
    similarity_scores: list[float]
    explanation: dict[str, Any]
    confidence: float
    analyzed_at: datetime

    model_config = {"from_attributes": True}


class PetitionWithAnalysis(PetitionOut):
    """Petition enriched with its AI analysis (if available)."""
    ai_analysis: AIAnalysisOut | None = None


class StatusUpdate(BaseModel):
    status: Literal["under_review", "resolved", "rejected"]
    note: str | None = None
    department_override: str | None = None
    priority_override: Literal["low", "medium", "high", "critical"] | None = None


class PetitionHistoryOut(BaseModel):
    id: UUID
    petition_id: UUID
    officer_id: UUID | None
    old_status: str | None
    new_status: str
    note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
