import uuid as uuid_lib
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.exceptions import RequestValidationError
import pydantic
from sqlalchemy.orm import Session

from database import get_db
from middleware.auth import get_current_user, get_current_user_from_token, require_officer
from models.petition_image import PetitionImage
from models.user import User
from repositories.petition_repo import PetitionRepository
from schemas.petition import (
    PetitionCreate,
    PetitionHistoryOut,
    PetitionImageOut,
    PetitionWithAnalysis,
    StatusUpdate,
    WithdrawRequest,
)
from services.petition_service import PetitionService
from config import settings

router = APIRouter()

# ---------------------------------------------------------------------------
# Constants for image upload validation
# ---------------------------------------------------------------------------
_ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024   # 5 MB
_MAX_FILES_PER_PETITION = 5


@router.post(
    "",
    response_model=PetitionWithAnalysis,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new petition with images (citizen only)",
)
async def submit_petition(
    title: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    latitude: float | None = Form(None, ge=-90.0, le=90.0),
    longitude: float | None = Form(None, ge=-180.0, le=180.0),
    location_source: str = Form("manual"),
    location_accuracy: float | None = Form(None),
    device_latitude: float | None = Form(None, ge=-90.0, le=90.0),
    device_longitude: float | None = Form(None, ge=-180.0, le=180.0),
    device_accuracy: float | None = Form(None),
    citizen_department_id: UUID | None = Form(None),
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PetitionWithAnalysis:
    if current_user.role not in ("citizen", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only citizens can submit petitions.",
        )
        
    if len(files) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one image is required.")
    if len(files) > _MAX_FILES_PER_PETITION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {_MAX_FILES_PER_PETITION} images allowed per petition.",
        )
    for f in files:
        if f.content_type not in _ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type '{f.content_type}'. Allowed: JPG, PNG, WebP.",
            )
            
    try:
        data = PetitionCreate(
            title=title,
            description=description,
            location=location,
            latitude=latitude,
            longitude=longitude,
            location_source=location_source,
            location_accuracy=location_accuracy,
            device_latitude=device_latitude,
            device_longitude=device_longitude,
            device_accuracy=device_accuracy,
            citizen_department_id=citizen_department_id,
        )
    except pydantic.ValidationError as e:
        raise RequestValidationError(e.errors())
    service = PetitionService(db)
    petition = await service.create_petition(data, files, current_user.id, current_user.name)
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
    "/active",
    response_model=list[PetitionWithAnalysis],
    summary="List active petitions for an officer's department (applies 2-day retention rule for finalized petitions)",
)
def list_active_petitions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_officer),
) -> list[PetitionWithAnalysis]:
    """
    Returns the Officer's working queue:
    - All non-finalized petitions (pending / analysed / under_review / withdrawn).
    - Finalized petitions (resolved / rejected / duplicate) only if finalized within
      the last 2 days (based on updated_at, server-side UTC).

    Department isolation is enforced server-side; the officer's department_id is
    taken from the JWT — never from a query parameter.
    """
    repo = PetitionRepository(db)
    if current_user.role == "officer":
        dept_id = current_user.department_id
    else:
        # Admins using this endpoint see all departments (no filter)
        dept_id = None
    if dept_id is None:
        # Fall back to get_all when no department scoping applies
        petitions = repo.get_all(skip=skip, limit=limit)
    else:
        petitions = repo.get_active_for_officer(department_id=dept_id, skip=skip, limit=limit)
    return [PetitionWithAnalysis.model_validate(p) for p in petitions]


@router.get(
    "/resolution-history",
    response_model=list[PetitionWithAnalysis],
    summary="List resolved/rejected/duplicate petitions for an officer's department (complete history)",
)
def list_resolution_history(
    status_filter: str | None = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_officer),
) -> list[PetitionWithAnalysis]:
    """
    Returns the complete finalized-petition history for the officer's department:
    resolved, rejected, and duplicate petitions — both recent and older than 2 days.

    Optionally filter by status (resolved | rejected | duplicate).

    Department isolation is enforced server-side from the JWT.
    """
    repo = PetitionRepository(db)
    if current_user.role == "officer":
        dept_id = current_user.department_id
    else:
        dept_id = None

    if dept_id is None:
        # Admin fallback: use get_all with status filter
        petitions = repo.get_all(status=status_filter, skip=skip, limit=limit)
    else:
        petitions = repo.get_resolution_history(
            department_id=dept_id,
            status_filter=status_filter,
            skip=skip,
            limit=limit,
        )
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
    
    # Enforce department isolation for officers
    if current_user.role == "officer":
        department_id = current_user.department_id
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

    # Officers can only view petitions in their department
    if current_user.role == "officer" and petition.department_id != current_user.department_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Petition belongs to a different department.")

    return PetitionWithAnalysis.model_validate(petition)


@router.patch(
    "/{petition_id}/withdraw",
    response_model=PetitionWithAnalysis,
    summary="Withdraw a petition (citizen only, before officer review)",
)
def withdraw_petition(
    petition_id: UUID,
    data: WithdrawRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PetitionWithAnalysis:
    if current_user.role != "citizen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only citizens can withdraw petitions.",
        )

    repo = PetitionRepository(db)
    petition = repo.get_by_id(petition_id)
    if not petition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Petition not found.")
    if petition.submitted_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only withdraw your own petitions.",
        )

    service = PetitionService(db)
    try:
        petition = service.withdraw_petition(petition, current_user.id, data.reason)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

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

    if current_user.role == "officer" and petition.department_id != current_user.department_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Petition belongs to a different department.")

    service = PetitionService(db)
    try:
        petition = service.update_status(
            petition=petition,
            new_status=data.status,
            officer_id=current_user.id,
            note=data.note,
            department_override=data.department_override,
            priority_override=data.priority_override,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
        
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


@router.post(
    "/{petition_id}/images",
    response_model=list[PetitionImageOut],
    status_code=status.HTTP_201_CREATED,
    summary="Upload images for a petition (citizen owner only)",
)
async def upload_petition_images(
    petition_id: UUID,
    files: list[UploadFile] = File(...),
    image_type: str = Form("petition"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PetitionImageOut]:
    repo = PetitionRepository(db)
    petition = repo.get_by_id(petition_id)
    if not petition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Petition not found.")

    if current_user.role == "citizen":
        if petition.submitted_by != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    elif current_user.role in ("officer", "admin"):
        # Allow officers and admins to upload resolution images
        pass
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    # Count existing images
    existing_count = len(petition.images) if petition.images else 0
    if existing_count + len(files) > _MAX_FILES_PER_PETITION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {_MAX_FILES_PER_PETITION} images allowed per petition "
                   f"(already has {existing_count}).",
        )

    from services.storage import get_storage_provider
    storage = get_storage_provider()
    image_folder = "petition_images" if image_type == "petition" else "resolution_proofs"

    saved: list[PetitionImage] = []

    for file in files:
        # Validate MIME type
        if file.content_type not in _ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type '{file.content_type}'. "
                       f"Allowed: JPG, PNG, WebP.",
            )

        content = await file.read()

        # Validate file size
        if len(content) > _MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{file.filename}' exceeds the 5 MB size limit.",
            )

        # Build a safe unique filename
        ext = "jpg"
        if file.filename and "." in file.filename:
            ext = file.filename.rsplit(".", 1)[-1].lower()
        unique_name = f"{uuid_lib.uuid4()}.{ext}"
        dest_path = f"{image_folder}/{petition_id}/{unique_name}"

        stored_path = await storage.save_file(content, dest_path, file.content_type or "image/jpeg")

        img = PetitionImage(
            petition_id=petition_id,
            filename=file.filename or unique_name,
            stored_path=stored_path,
            mime_type=file.content_type,
            file_size=len(content),
            image_type=image_type,
        )
        db.add(img)
        saved.append(img)

    db.commit()
    for img in saved:
        db.refresh(img)

    return [PetitionImageOut.model_validate(img) for img in saved]


@router.get(
    "/{petition_id}/images/{filename}",
    summary="Securely fetch a petition image",
)
async def get_petition_image(
    petition_id: UUID,
    filename: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_token),
):
    from fastapi.responses import FileResponse, Response
    from services.storage import get_storage_provider
    
    repo = PetitionRepository(db)
    petition = repo.get_by_id(petition_id)
    if not petition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Petition not found.")

    # Authorization Check
    if current_user.role == "citizen":
        if petition.submitted_by != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    elif current_user.role == "officer":
        if petition.department_id != current_user.department_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    # Validate image exists in DB
    from models.petition_image import PetitionImage
    img_record = db.query(PetitionImage).filter(
        PetitionImage.petition_id == petition_id,
        PetitionImage.filename == filename
    ).first()
    
    if not img_record:
        img_record = db.query(PetitionImage).filter(
            PetitionImage.petition_id == petition_id,
            PetitionImage.stored_path.endswith(filename)
        ).first()

    if not img_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found.")

    storage = get_storage_provider()
    local_path = storage.get_local_path(img_record.stored_path)
    if local_path and local_path.is_file():
        return FileResponse(local_path, media_type=img_record.mime_type)

    file_bytes = await storage.get_file_bytes(img_record.stored_path)
    if file_bytes:
        return Response(content=file_bytes, media_type=img_record.mime_type)

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image file is missing from storage.")
