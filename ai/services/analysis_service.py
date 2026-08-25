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
from database import fetch_departments

_BASE = Path(__file__).parent.parent
_CACHED_DEPARTMENTS: list[dict] = []
_BASE_SYSTEM_PROMPT: str | None = None

async def get_system_prompt() -> str:
    global _BASE_SYSTEM_PROMPT, _CACHED_DEPARTMENTS
    if _BASE_SYSTEM_PROMPT is None:
        _BASE_SYSTEM_PROMPT = (_BASE / "prompts" / "analysis.md").read_text(encoding="utf-8")
        
    if not _CACHED_DEPARTMENTS:
        _CACHED_DEPARTMENTS = await fetch_departments()
        if not _CACHED_DEPARTMENTS:
            logger.error(
                "fetch_departments() returned empty list. Check DATABASE_URL in ai/.env "
                "and ensure PostgreSQL is reachable and departments are seeded."
            )
        
    # Build dynamic department list
    dept_text = "## Valid Departments & Mandates\n\n"
    for dept in _CACHED_DEPARTMENTS:
        dept_text += f"- {dept['name']}: {dept['description']}\n"
        
    # Replace the placeholder in the base prompt (or just append if not using a placeholder)
    # The current analysis.md has a hardcoded list under "## Valid Departments & Mandates".
    # We will strip out the hardcoded list by splitting the text or just rebuilding it.
    prompt = _BASE_SYSTEM_PROMPT
    if "## Valid Departments & Mandates" in prompt:
        parts = prompt.split("## Valid Departments & Mandates")
        head = parts[0]
        # Find where the next section starts
        tail = "## Priority Levels" + parts[1].split("## Priority Levels")[1]
        prompt = head + dept_text + "\n" + tail
        
    return prompt


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
    system_prompt = await get_system_prompt()
    llm_output = await llm_service.generate_json(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
    )

    # --- Step 4: Deterministic department resolution ---
    valid_names = [d["name"] for d in _CACHED_DEPARTMENTS]

    if not valid_names:
        # This means the DB fetch failed at startup — do not crash, raise clearly
        raise RuntimeError(
            "Department list is empty. The AI service cannot connect to the database "
            "or no departments have been seeded. Check DATABASE_URL in ai/.env and "
            "ensure the database is reachable."
        )

    category: str = llm_output.get("category", "Other")
    if category not in valid_names:
        logger.warning(
            f"[{request.id}] LLM returned unknown category '{category}'; falling back to default."
        )
        category = "Mudalvarin Mugavari Department" if "Mudalvarin Mugavari Department" in valid_names else valid_names[0]

    department: str = category

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
