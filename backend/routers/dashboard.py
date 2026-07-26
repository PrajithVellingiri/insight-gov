from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from middleware.auth import require_officer
from models.user import User
from schemas.analytics import DashboardStats
from services.analytics_service import AnalyticsService

router = APIRouter()


@router.get(
    "/dashboard",
    response_model=DashboardStats,
    summary="Get summary statistics for the officer / admin dashboard",
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_officer),
) -> DashboardStats:
    return AnalyticsService(db).get_dashboard_stats()
