"""
routers/admin.py – Admin-only endpoints for department and officer management.

These endpoints are consumed by the frontend's admin.api.js module.
All routes require admin authentication.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from middleware.auth import require_admin
from models.department import Department
from models.user import User
from repositories.department_repo import DepartmentRepository
from repositories.user_repo import UserRepository
from schemas.auth import OfficerCreateRequest, UserOut
from schemas.department import DepartmentCreate, DepartmentOut
from services.auth_service import AuthService

router = APIRouter()


# ---------------------------------------------------------------------------
# Departments
# ---------------------------------------------------------------------------

@router.get(
    "/departments",
    response_model=list[DepartmentOut],
    summary="List all departments (admin only)",
)
def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> list[DepartmentOut]:
    repo = DepartmentRepository(db)
    return [DepartmentOut.model_validate(d) for d in repo.get_all()]


@router.post(
    "/departments",
    response_model=DepartmentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new department (admin only)",
)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> DepartmentOut:
    repo = DepartmentRepository(db)
    existing = repo.get_by_name(data.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Department '{data.name}' already exists.",
        )
    dept = repo.create(Department(name=data.name))
    return DepartmentOut.model_validate(dept)


# ---------------------------------------------------------------------------
# Officers
# ---------------------------------------------------------------------------

@router.get(
    "/officers",
    response_model=list[UserOut],
    summary="List all officers (admin only)",
)
def list_officers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> list[UserOut]:
    repo = UserRepository(db)
    officers = repo.get_officers()
    return [UserOut.model_validate(u) for u in officers]


@router.post(
    "/officers",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new officer account (admin only)",
)
def create_officer(
    data: OfficerCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> UserOut:
    """
    Creates an officer account assigned to the given department.

    Validates:
      - Email uniqueness (409 Conflict)
      - Department existence (400 Bad Request)
    """
    user_repo = UserRepository(db)
    dept_repo = DepartmentRepository(db)

    if user_repo.get_by_email(data.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    department = dept_repo.get_by_id(data.department_id)
    if not department:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department does not exist.",
        )

    user = User(
        name=data.name,
        email=data.email,
        hashed_password=AuthService.hash_password(data.password),
        role="officer",
        department_id=data.department_id,
    )
    user = user_repo.create(user)
    return UserOut.model_validate(user)
