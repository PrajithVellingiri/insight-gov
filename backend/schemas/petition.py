from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator, AliasChoices

class PetitionCreate(BaseModel):
    title: str
    description: str
    location: str
    latitude: float | None = Field(default=None, ge=-90.0, le=90.0)
    longitude: float | None = Field(default=None, ge=-180.0, le=180.0)
    location_source: str = Field(default="manual")
    location_accuracy: float | None = Field(default=None)
    device_latitude: float | None = Field(default=None, ge=-90.0, le=90.0)
    device_longitude: float | None = Field(default=None, ge=-180.0, le=180.0)
    device_accuracy: float | None = Field(default=None)
    citizen_department_id: UUID | None = None


class StatusUpdate(BaseModel):
    status: str
    note: str | None = None
    department_override: str | None = None
    priority_override: str | None = None


class WithdrawRequest(BaseModel):
    reason: str


class PetitionHistoryOut(BaseModel):
    id: UUID
    petition_id: UUID
    changed_by_id: UUID
    changed_by_role: str
    old_status: str
    new_status: str
    remarks: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PetitionImageOut(BaseModel):
    id: UUID
    filename: str
    stored_path: str
    mime_type: str
    image_type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PetitionOut(BaseModel):
    id: UUID
    petition_number: str
    title: str
    description: str
    status: str
    latitude: float | None = None
    longitude: float | None = None
    location_status: str
    location_source: str
    location_accuracy: float | None = None
    device_latitude: float | None = None
    device_longitude: float | None = None
    device_accuracy: float | None = None
    location_verification_status: str
    location_verification_reason: str | None = None
    location_verified_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    submitter_id: UUID = Field(validation_alias=AliasChoices("submitter_id", "submitted_by"))
    submitter_name: str | None = None
    submitter_email: str | None = None
    department_id: UUID | None
    citizen_department_id: UUID | None = None
    department_match: bool | None = None
    # Department details (flattened)
    department_name: str | None = None
    department_code: str | None = None
    officer_id: UUID | None
    is_duplicate: bool
    duplicate_count: int = 0
    withdrawal_reason: str | None = None
    images: list[PetitionImageOut] = []
    
    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def extract_relations(cls, data):
        # Extract submitter name
        if hasattr(data, "citizen") and data.citizen:
            data.submitter_name = data.citizen.name
            data.submitter_email = data.citizen.email
        elif isinstance(data, dict) and data.get("citizen"):
            data["submitter_name"] = data["citizen"]["name"]
            data["submitter_email"] = data["citizen"]["email"]

        # Extract department name and code
        if hasattr(data, "department") and data.department:
            data.department_name = data.department.name
            data.department_code = data.department.department_code
        elif isinstance(data, dict) and data.get("department"):
            data["department_name"] = data["department"]["name"]
            data["department_code"] = data["department"]["department_code"]

        return data


class AIAnalysisOut(BaseModel):
    id: UUID
    petition_id: UUID
    category: str | None = Field(validation_alias=AliasChoices("suggested_category", "category"))
    confidence: float | None = Field(validation_alias=AliasChoices("confidence_score", "confidence"))
    is_duplicate: bool = False
    duplicate_of_id: UUID | None = None
    explanation: dict | None = None
    priority: str | None
    department: str | None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def extract_computed_fields(cls, data):
        if hasattr(data, "duplicate_ids"):
            dupes = data.duplicate_ids
            data.is_duplicate = len(dupes) > 0
            data.duplicate_of_id = dupes[0] if dupes else None
            exp = data.explanation
        elif isinstance(data, dict):
            dupes = data.get("duplicate_ids", [])
            data["is_duplicate"] = len(dupes) > 0
            data["duplicate_of_id"] = dupes[0] if dupes else None
            exp = data.get("explanation")
        return data


class PetitionWithAnalysis(PetitionOut):
    ai_analysis: AIAnalysisOut | None = None

    model_config = ConfigDict(from_attributes=True)
