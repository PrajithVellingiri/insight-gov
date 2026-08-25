from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, model_validator


class CitizenRegisterRequest(BaseModel):
    """Public registration — citizens only.  department_id is never accepted."""

    name: str = Field(..., min_length=1, max_length=128)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: Literal["citizen"] = "citizen"


class OfficerCreateRequest(BaseModel):
    """Admin-only officer creation — department_id is mandatory."""

    name: str = Field(..., min_length=1, max_length=128)
    email: EmailStr
    password: str = Field(..., min_length=8)
    department_id: UUID = Field(
        ..., description="Must reference an existing department."
    )


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: UUID
    name: str
    email: str
    role: str
    department_id: UUID | None
    department_name: str | None = None
    preferences: dict[str, Any]
    created_at: datetime

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def extract_department_name(cls, data: Any) -> Any:
        if hasattr(data, "department") and data.department:
            data.department_name = data.department.name
        elif isinstance(data, dict) and "department" in data and data["department"]:
            data["department_name"] = data["department"]["name"]
        return data


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class PreferencesUpdate(BaseModel):
    language: str | None = None
    voice_input: bool | None = None
    high_contrast: bool | None = None
    font_size: str | None = None
    theme: Literal["light", "dark", "system"] | None = None
