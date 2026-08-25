from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from repositories.department_repo import DepartmentRepository
from schemas.department import DepartmentOut
from middleware.auth import get_current_user

router = APIRouter()

@router.get(
    "/departments",
    response_model=list[DepartmentOut],
    summary="List all departments (public/authenticated)",
)
def list_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DepartmentOut]:
    repo = DepartmentRepository(db)
    return [DepartmentOut.model_validate(d) for d in repo.get_all()]
