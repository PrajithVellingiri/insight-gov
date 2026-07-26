"""
schemas/analysis.py – Pydantic response models for AI endpoints.

These schemas form the output contract for POST /ai/analyze and POST /ai/search.
The `explanation` field provides structured explainability for every AI decision.
"""

from __future__ import annotations

from datetime import datetime
from typing import List
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# POST /ai/analyze
# ---------------------------------------------------------------------------

class Explanation(BaseModel):
    """
    Structured explainability block.
    Describes the AI's reasoning for each key decision in plain language.
    """

    category_reason: str = Field(..., description="Why this category was chosen.")
    priority_reason: str = Field(..., description="Why this priority level was assigned.")
    department_reason: str = Field(..., description="Why this type of government department should handle the petition.")


class AnalysisResult(BaseModel):
    """Response body for POST /ai/analyze."""

    petition_id: str = Field(..., description="The petition UUID that was analysed.")
    category: str = Field(..., description="Predicted petition category (e.g., Infrastructure, Health).")
    department: str = Field(..., description="Resolved government department (from department_mapping.json).")
    priority: str = Field(..., description="Predicted priority level: low | medium | high | critical.")
    summary: str = Field(..., description="2–3 sentence executive summary of the petition.")
    duplicate_ids: List[str] = Field(default_factory=list, description="IDs of similar petitions above the duplicate threshold.")
    similarity_scores: List[float] = Field(default_factory=list, description="Cosine similarity scores for each duplicate_id (same order).")
    explanation: Explanation = Field(..., description="Structured AI reasoning for category, priority, and department decisions.")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Overall confidence of the AI analysis (0.0–1.0).")
    analyzed_at: datetime = Field(..., description="UTC timestamp when the analysis was performed.")

    model_config = {
        "json_schema_extra": {
            "example": {
                "petition_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "category": "Infrastructure",
                "department": "Public Works Department",
                "priority": "high",
                "summary": "Residents of MG Road, Gandhi Nagar report that streetlights have been non-functional for three weeks. The darkness poses a significant safety risk, especially for pedestrians and late-night commuters. Immediate restoration of lighting is requested.",
                "duplicate_ids": [],
                "similarity_scores": [],
                "explanation": {
                    "category_reason": "The petition concerns public street infrastructure (streetlights), which falls under the Infrastructure category.",
                    "priority_reason": "Non-functional streetlights over an extended period create a public safety hazard affecting a broad area, warranting high priority.",
                    "department_reason": "Maintenance of public road infrastructure and lighting is the responsibility of the Public Works or Municipal body.",
                },
                "confidence": 0.92,
                "analyzed_at": "2026-07-25T06:00:00Z",
            }
        }
    }


# ---------------------------------------------------------------------------
# POST /ai/search
# ---------------------------------------------------------------------------

class SearchResultItem(BaseModel):
    """A single semantic search hit."""

    petition_id: str = Field(..., description="Petition UUID.")
    score: float = Field(..., ge=0.0, le=1.0, description="Cosine similarity score (higher = more similar).")
    title: str = Field(..., description="Petition title.")
    description: str = Field(..., description="Petition description text.")
    category: str = Field(..., description="Petition category stored in ChromaDB.")


class SearchResponse(BaseModel):
    """Response body for POST /ai/search."""

    results: List[SearchResultItem] = Field(default_factory=list, description="Ranked list of semantically similar petitions.")

    model_config = {
        "json_schema_extra": {
            "example": {
                "results": [
                    {
                        "petition_id": "abc12345-0000-0000-0000-000000000001",
                        "score": 0.91,
                        "title": "Pothole on Ring Road",
                        "description": "Large potholes near the junction causing accidents.",
                        "category": "Infrastructure",
                    }
                ]
            }
        }
    }
