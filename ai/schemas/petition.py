"""
schemas/petition.py – Pydantic request models for AI endpoints.

These schemas form the input contract for POST /ai/analyze and POST /ai/search
as listed in API_CONTRACTS.md.
"""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class PetitionAnalyzeRequest(BaseModel):
    """Request body for POST /ai/analyze."""

    id: str = Field(..., description="Unique petition identifier (UUID).")
    title: str = Field(..., min_length=1, description="Short title of the petition.")
    description: str = Field(..., min_length=1, description="Full petition description.")
    location: str = Field(..., min_length=1, description="Location where the issue was reported.")
    submitted_by: Optional[str] = Field(None, description="Display name of the citizen who submitted the petition.")
    latitude: Optional[float] = Field(None, description="Latitude of the issue.")
    longitude: Optional[float] = Field(None, description="Longitude of the issue.")

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "title": "Broken streetlights on MG Road",
                "description": "The streetlights on MG Road between Gandhi Nagar and Civil Lines have been non-functional for the past three weeks, making the area unsafe at night.",
                "location": "MG Road, Gandhi Nagar, Delhi",
                "submitted_by": "Rajesh Kumar",
            }
        }
    }


class SearchRequest(BaseModel):
    """Request body for POST /ai/search."""

    query: str = Field(..., min_length=1, description="Natural language search query.")
    top_k: int = Field(5, ge=1, le=50, description="Maximum number of results to return.")
    filters: Optional[dict[str, Any]] = Field(None, description="Optional metadata filters (reserved for future use).")

    model_config = {
        "json_schema_extra": {
            "example": {
                "query": "road damage and pothole complaints",
                "top_k": 5,
            }
        }
    }
