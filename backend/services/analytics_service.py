from sqlalchemy.orm import Session

from repositories.ai_analysis_repo import AIAnalysisRepository
from repositories.petition_repo import PetitionRepository
from schemas.analytics import (
    AnalyticsOut,
    CategoryCount,
    DashboardStats,
    DepartmentCount,
    PriorityBreakdown,
    StatusBreakdown,
)


class AnalyticsService:
    """Aggregates petition and AI analysis data for dashboard and analytics views."""

    def __init__(self, db: Session) -> None:
        self._petition_repo = PetitionRepository(db)
        self._ai_analysis_repo = AIAnalysisRepository(db)

    def _build_status_breakdown(self) -> StatusBreakdown:
        statuses = ["pending", "analysed", "under_review", "resolved", "rejected"]
        counts = {s: self._petition_repo.count_by_status(s) for s in statuses}
        return StatusBreakdown(
            pending=counts["pending"],
            analysed=counts["analysed"],
            under_review=counts["under_review"],
            resolved=counts["resolved"],
            rejected=counts["rejected"],
        )

    def _build_priority_breakdown(self) -> PriorityBreakdown:
        raw = self._ai_analysis_repo.get_all_priorities()
        counts = dict(raw)
        return PriorityBreakdown(
            low=counts.get("low", 0),
            medium=counts.get("medium", 0),
            high=counts.get("high", 0),
            critical=counts.get("critical", 0),
        )

    def get_dashboard_stats(self) -> DashboardStats:
        total = self._petition_repo.count_all()
        status_bkd = self._build_status_breakdown()
        priority_bkd = self._build_priority_breakdown()
        return DashboardStats(
            total_petitions=total,
            status_breakdown=status_bkd,
            priority_breakdown=priority_bkd,
            pending_count=status_bkd.pending,
            duplicate_count=self._petition_repo.count_duplicates(),
        )

    def get_analytics(self) -> AnalyticsOut:
        total = self._petition_repo.count_all()
        status_bkd = self._build_status_breakdown()
        priority_bkd = self._build_priority_breakdown()

        categories = [
            CategoryCount(category=cat, count=cnt)
            for cat, cnt in self._ai_analysis_repo.get_all_categories()
        ]
        departments = [
            DepartmentCount(department=dept, count=cnt)
            for dept, cnt in self._ai_analysis_repo.get_all_departments()
        ]

        resolved = status_bkd.resolved
        resolution_rate = (resolved / total) if total > 0 else 0.0

        return AnalyticsOut(
            total_petitions=total,
            status_breakdown=status_bkd,
            priority_breakdown=priority_bkd,
            category_distribution=categories,
            department_distribution=departments,
            duplicate_count=self._petition_repo.count_duplicates(),
            resolution_rate=round(resolution_rate, 4),
        )
