"""
services/analysis_service.py – Orchestrator for full petition analysis.

Pipeline:
    1. Embed petition text (title + description + location).
    2. Find duplicate petitions in ChromaDB (before storing this one).
    3. Call the LLM to predict category, priority, summary, explanation, confidence.
    4. Resolve the department deterministically from department_mapping.json.
    5. Store the petition embedding in ChromaDB (with category metadata).
    6. Return a validated AnalysisResult.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from schemas.analysis import AnalysisResult, Explanation
from schemas.petition import PetitionAnalyzeRequest
from services import duplicate_service, embedding_service, llm_service
from utils.logger import get_logger

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Load prompt template and department mapping once at module import time.
# Both are plain data files — no Python logic embedded.
# ---------------------------------------------------------------------------
_BASE = Path(__file__).parent.parent

_SYSTEM_PROMPT: str | None = None
_DEPARTMENT_MAPPING: dict[str, str] | None = None

def get_system_prompt() -> str:
    global _SYSTEM_PROMPT
    if _SYSTEM_PROMPT is None:
        _SYSTEM_PROMPT = (_BASE / "prompts" / "analysis.md").read_text(encoding="utf-8")
    return _SYSTEM_PROMPT

def get_department_mapping() -> dict[str, str]:
    global _DEPARTMENT_MAPPING
    if _DEPARTMENT_MAPPING is None:
        _DEPARTMENT_MAPPING = json.loads((_BASE / "department_mapping.json").read_text(encoding="utf-8"))
    return _DEPARTMENT_MAPPING


async def analyze(request: PetitionAnalyzeRequest) -> AnalysisResult:
    """
    Run the full AI analysis pipeline for a single petition.

    Args:
        request: Validated petition input from POST /ai/analyze.

    Returns:
        AnalysisResult with category, department, priority, summary,
        duplicates, explanation, confidence, and timestamp.
    """
    petition_text = (
        f"Title: {request.title}\n"
        f"Description: {request.description}\n"
        f"Location: {request.location}"
    )

    # --- Step 1: Generate embedding ---
    logger.info(f"[{request.id}] Generating embedding.")
    # For duplicate detection, we embed the title as requested to serve as the second semantic factor
    embedding = await embedding_service.embed(request.title)

    # --- Step 2: Duplicate detection (before storing so we don't match self) ---
    logger.info(f"[{request.id}] Checking for duplicates.")
    duplicate_ids, similarity_scores = await duplicate_service.find_duplicates(
        petition_id=request.id,
        embedding=embedding,
        latitude=request.latitude,
        longitude=request.longitude,
    )

    # --- Step 3: LLM analysis ---
    logger.info(f"[{request.id}] Running LLM analysis.")
    user_prompt = petition_text  # Reuse the same formatted string
    llm_output = await llm_service.generate_json(
        system_prompt=get_system_prompt(),
        user_prompt=user_prompt,
    )

    # --- Step 4: Deterministic department resolution ---
    department_mapping = get_department_mapping()
    category: str = llm_output.get("category", "Other")
    if category not in department_mapping:
        logger.warning(
            f"[{request.id}] LLM returned unknown category '{category}'; falling back to 'Other'."
        )
        category = "Other"

    department: str = department_mapping[category]

    metadata = {
        "title": request.title,
        "location": request.location,
        "category": category,
    }
    if request.latitude is not None:
        metadata["latitude"] = request.latitude
    if request.longitude is not None:
        metadata["longitude"] = request.longitude

    duplicate_service.store_petition(
        petition_id=request.id,
        text=request.title, # Store the embedded text (title) for consistency
        embedding=embedding,
        metadata=metadata,
    )

    # --- Step 6: Assemble and return the result ---
    explanation_raw: dict = llm_output.get("explanation", {})

    return AnalysisResult(
        petition_id=request.id,
        category=category,
        department=department,
        priority=llm_output.get("priority", "medium"),
        summary=llm_output.get("summary", ""),
        duplicate_ids=duplicate_ids,
        similarity_scores=similarity_scores,
        explanation=Explanation(
            category_reason=explanation_raw.get("category_reason", ""),
            priority_reason=explanation_raw.get("priority_reason", ""),
            department_reason=explanation_raw.get("department_reason", ""),
        ),
        confidence=float(llm_output.get("confidence", 0.0)),
        analyzed_at=datetime.now(timezone.utc),
    )
