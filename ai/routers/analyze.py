"""
routers/analyze.py – POST /ai/analyze endpoint.

Receives a petition payload, delegates to analysis_service, and returns
a structured AnalysisResult including category, department, priority,
summary, duplicates, and an explanation block.
"""

from fastapi import APIRouter, HTTPException

from schemas.analysis import AnalysisResult
from schemas.petition import PetitionAnalyzeRequest
from services import analysis_service
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.post(
    "/ai/analyze",
    response_model=AnalysisResult,
    summary="Analyse a citizen petition",
    description=(
        "Runs the full AI pipeline: embedding, duplicate detection, LLM analysis, "
        "and deterministic department resolution. Returns a structured result with "
        "an `explanation` block for full decision explainability."
    ),
)
async def analyze_petition(request: PetitionAnalyzeRequest) -> AnalysisResult:
    """Analyse a petition and return a structured AI result."""
    try:
        result = await analysis_service.analyze(request)
        return result
    except Exception as exc:
        logger.error(f"[{request.id}] Analysis failed: {exc}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Petition analysis failed: {str(exc)}",
        )
