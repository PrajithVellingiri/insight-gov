"""
routers/search.py – POST /ai/search endpoint.

Receives a natural language query and returns a ranked list of semantically
similar petitions from the ChromaDB vector store.
"""

from fastapi import APIRouter, HTTPException

from schemas.analysis import SearchResponse
from schemas.petition import SearchRequest
from services import search_service
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.post(
    "/ai/search",
    response_model=SearchResponse,
    summary="Semantic search over stored petitions",
    description=(
        "Embeds the query using nomic-embed-text and performs a cosine similarity "
        "search over all petitions stored in ChromaDB. Returns the top-k results "
        "ordered by relevance score."
    ),
)
async def semantic_search(request: SearchRequest) -> SearchResponse:
    """Search petitions semantically by natural language query."""
    try:
        result = await search_service.search(query=request.query, top_k=request.top_k)
        return result
    except Exception as exc:
        logger.error(f"Search failed for query '{request.query[:80]}': {exc}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Semantic search failed: {str(exc)}",
        )
