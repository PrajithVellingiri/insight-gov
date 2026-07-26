from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from middleware.auth import get_current_user, require_officer
from models.user import User
from repositories.petition_repo import PetitionRepository
from schemas.petition import (
    PetitionCreate,
    PetitionHistoryOut,
    PetitionOut,
    PetitionWithAnalysis,
    StatusUpdate,
)
from services.petition_service import PetitionService

router = APIRouter()


@router.post(
    "",
    response_model=PetitionWithAnalysis,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new petition (citizen only)",
)
async def submit_petition(
    data: PetitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PetitionWithAnalysis:
    if current_user.role not in ("citizen", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only citizens can submit petitions.",
        )
    service = PetitionService(db)
    petition = await service.create_petition(data, current_user.id, current_user.name)
    return PetitionWithAnalysis.model_validate(petition)


@router.get(
    "/my",
    response_model=list[PetitionWithAnalysis],
    summary="List the authenticated citizen's own petitions",
)
def get_my_petitions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PetitionWithAnalysis]:
    repo = PetitionRepository(db)
    petitions = repo.get_by_user(current_user.id, skip=skip, limit=limit)
    return [PetitionWithAnalysis.model_validate(p) for p in petitions]


@router.get(
    "",
    response_model=list[PetitionWithAnalysis],
    summary="List all petitions (officer / admin only)",
)
def list_petitions(
    status_filter: str | None = Query(None, alias="status"),
    department_id: UUID | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_officer),
) -> list[PetitionWithAnalysis]:
    repo = PetitionRepository(db)
    petitions = repo.get_all(
        status=status_filter,
        department_id=department_id,
        skip=skip,
        limit=limit,
    )
    return [PetitionWithAnalysis.model_validate(p) for p in petitions]


@router.get(
    "/{petition_id}",
    response_model=PetitionWithAnalysis,
    summary="Get a single petition with its AI analysis",
)
def get_petition(
    petition_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PetitionWithAnalysis:
    repo = PetitionRepository(db)
    petition = repo.get_by_id(petition_id)
    if not petition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Petition not found.")

    # Citizens can only view their own petitions
    if current_user.role == "citizen" and petition.submitted_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    return PetitionWithAnalysis.model_validate(petition)


@router.patch(
    "/{petition_id}/status",
    response_model=PetitionWithAnalysis,
    summary="Update petition status (officer only)",
)
def update_petition_status(
    petition_id: UUID,
    data: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_officer),
) -> PetitionWithAnalysis:
    repo = PetitionRepository(db)
    petition = repo.get_by_id(petition_id)
    if not petition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Petition not found.")

    service = PetitionService(db)
    petition = service.update_status(
        petition=petition,
        new_status=data.status,
        officer_id=current_user.id,
        note=data.note,
        department_override=data.department_override,
        priority_override=data.priority_override,
    )
    return PetitionWithAnalysis.model_validate(petition)


@router.get(
    "/{petition_id}/history",
    response_model=list[PetitionHistoryOut],
    summary="Get the status change history of a petition",
)
def get_petition_history(
    petition_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_officer),
) -> list[PetitionHistoryOut]:
    from repositories.petition_history_repo import PetitionHistoryRepository
    repo = PetitionHistoryRepository(db)
    records = repo.get_by_petition_id(petition_id)
    return [PetitionHistoryOut.model_validate(r) for r in records]
