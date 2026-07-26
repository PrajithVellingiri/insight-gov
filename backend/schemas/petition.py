from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class PetitionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=256)
    description: str = Field(..., min_length=10)
    location: str = Field(..., min_length=1, max_length=256)
    latitude: float | None = None
    longitude: float | None = None


class PetitionOut(BaseModel):
    id: UUID
    title: str
    description: str
    location: str
    latitude: float | None = None
    longitude: float | None = None
    status: str
    submitted_by: UUID
    submitter_name: str | None = None
    submitter_email: str | None = None
    department_id: UUID | None
    department_name: str | None = None
    officer_id: UUID | None
    is_duplicate: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def extract_relations_info(cls, data: Any) -> Any:
        # If it's an SQLAlchemy model instance with the 'citizen' relationship loaded
        if hasattr(data, "citizen") and data.citizen:
            data.submitter_name = data.citizen.name
            data.submitter_email = data.citizen.email
        # If it's a dict
        elif isinstance(data, dict) and "citizen" in data and data["citizen"]:
            data["submitter_name"] = data["citizen"]["name"]
            data["submitter_email"] = data["citizen"]["email"]

        # Extract department name
        if hasattr(data, "department") and data.department:
            data.department_name = data.department.name
        elif isinstance(data, dict) and "department" in data and data["department"]:
            data["department_name"] = data["department"]["name"]
        
        return data


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
    history: list["PetitionHistoryOut"] = []


class StatusUpdate(BaseModel):
    status: Literal["under_review", "resolved", "rejected"]
    note: str | None = None
    department_override: str | None = None
    priority_override: Literal["low", "medium", "high", "critical"] | None = None


class PetitionHistoryOut(BaseModel):
    id: UUID
    petition_id: UUID
    officer_id: UUID | None
    officer_name: str | None = None
    old_status: str | None
    new_status: str
    note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def extract_officer_name(cls, data: Any) -> Any:
        if hasattr(data, "officer") and data.officer:
            data.officer_name = data.officer.name
        elif isinstance(data, dict) and "officer" in data and data["officer"]:
            data["officer_name"] = data["officer"]["name"]
        return data
