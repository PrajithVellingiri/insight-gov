from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from middleware.auth import require_officer
from models.user import User
from services.ai_client import AIClient

router = APIRouter()


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    top_k: int = Field(5, ge=1, le=50)


@router.post(
    "/search",
    summary="Semantic search over stored petitions (officer only)",
    response_model=dict,
)
async def semantic_search(
    data: SearchRequest,
    current_user: User = Depends(require_officer),
) -> dict:
    """
    Proxies the search request to the AI service and returns the results.
    The frontend never calls the AI service directly.
    """
    client = AIClient()
    return await client.search(query=data.query, top_k=data.top_k)
