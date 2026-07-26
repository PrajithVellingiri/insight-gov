from schemas.auth import (
    CitizenRegisterRequest,
    OfficerCreateRequest,
    LoginRequest,
    TokenResponse,
    UserOut,
)
from schemas.petition import (
    PetitionCreate,
    PetitionOut,
    PetitionWithAnalysis,
    StatusUpdate,
    AIAnalysisOut,
    PetitionHistoryOut,
)
from schemas.department import DepartmentCreate, DepartmentOut
from schemas.notification import NotificationOut
from schemas.analytics import DashboardStats, AnalyticsOut

__all__ = [
    "CitizenRegisterRequest",
    "OfficerCreateRequest",
    "LoginRequest",
    "TokenResponse",
    "UserOut",
    "PetitionCreate",
    "PetitionOut",
    "PetitionWithAnalysis",
    "StatusUpdate",
    "AIAnalysisOut",
    "PetitionHistoryOut",
    "DepartmentCreate",
    "DepartmentOut",
    "NotificationOut",
    "DashboardStats",
    "AnalyticsOut",
]
