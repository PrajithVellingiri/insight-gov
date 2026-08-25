from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from middleware.auth import require_officer
from models.petition import Petition
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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_officer),
) -> dict:
    """
    Proxies the search request to the AI service and returns the results,
    enriched with the current petition status and department isolation guard.

    - The AI service searches ALL petitions in ChromaDB (no status filter).
    - Results are enriched with status from PostgreSQL.
    - Officers only see results from their own department (IDOR protection).
    """
    client = AIClient()
    try:
        raw = await client.search(query=data.query, top_k=data.top_k)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc)
        )

    results = raw.get("results", [])
    if not results:
        return raw

    # Enrich with status and enforce department isolation
    filtered_results = []
    for item in results:
        try:
            petition_uuid = UUID(item["petition_id"])
        except (ValueError, KeyError):
            continue

        petition = db.query(Petition).filter(Petition.id == petition_uuid).first()
        if petition is None:
            # Petition was deleted or not yet in DB — skip
            continue

        # Department isolation: officers only see their department's petitions
        if current_user.role == "officer" and petition.department_id != current_user.department_id:
            continue

        item["status"] = petition.status
        filtered_results.append(item)

    return {"results": filtered_results}
