from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from middleware.auth import require_admin
from models.user import User
from schemas.analytics import AnalyticsOut
from services.analytics_service import AnalyticsService

router = APIRouter()


@router.get(
    "/analytics",
    response_model=AnalyticsOut,
    summary="Get full analytics breakdown (admin only)",
)
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
) -> AnalyticsOut:
    return AnalyticsService(db).get_analytics()
