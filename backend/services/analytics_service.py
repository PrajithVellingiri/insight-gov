from collections import Counter
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from repositories.ai_analysis_repo import AIAnalysisRepository
from repositories.department_repo import DepartmentRepository
from repositories.petition_repo import PetitionRepository
from repositories.user_repo import UserRepository
from schemas.analytics import (
    AdminCharts,
    AdminStats,
    AnalyticsOut,
    CategoryCount,
    ChartPoint,
    DashboardStats,
    PriorityBreakdown,
    StatusBreakdown,
    StatusCount,
)


class AnalyticsService:
    """Aggregates petition and AI analysis data for dashboard and analytics views."""

    def __init__(self, db: Session) -> None:
        self._db = db
        self._petition_repo = PetitionRepository(db)
        self._ai_analysis_repo = AIAnalysisRepository(db)
        self._user_repo = UserRepository(db)
        self._department_repo = DepartmentRepository(db)

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
        resolved = self._petition_repo.count_by_status("resolved")
        active_officers = len(self._user_repo.get_officers())
        total_departments = len(self._department_repo.get_all())

        stats = AdminStats(
            total_petitions=total,
            resolved_petitions=resolved,
            active_officers=active_officers,
            total_departments=total_departments,
        )

        statuses = ["pending", "analysed", "under_review", "resolved", "rejected", "duplicate"]
        by_status = [
            StatusCount(
                status=s, 
                count=self._petition_repo.count_by_status(s) if s != "duplicate" else self._petition_repo.count_duplicates()
            )
            for s in statuses
        ]

        categories = [
            CategoryCount(category=cat, count=cnt)
            for cat, cnt in self._ai_analysis_repo.get_all_categories()
        ]

        # Trend (Last 30 Days)
        petitions = self._petition_repo.get_all(limit=10000)
        date_counts = Counter([p.created_at.strftime("%Y-%m-%d") for p in petitions if p.created_at])
        
        trend = []
        for i in range(29, -1, -1):
            d = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
            trend.append(ChartPoint(date=d, count=date_counts.get(d, 0)))

        charts = AdminCharts(
            trend=trend,
            by_status=by_status,
            by_category=categories,
        )

        map_data = []
        for p in petitions:
            priority = None
            if p.ai_analysis:
                priority = p.ai_analysis.priority

            map_data.append({
                "id": str(p.id),
                "title": p.title,
                "location": p.location,
                "status": p.status,
                "priority": priority,
            })

        return AnalyticsOut(
            stats=stats,
            charts=charts,
            mapData=map_data,
        )
