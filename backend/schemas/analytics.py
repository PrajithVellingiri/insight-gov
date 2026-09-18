from pydantic import BaseModel
from typing import Any

class StatusBreakdown(BaseModel):
    pending: int = 0
    analysed: int = 0
    under_review: int = 0
    resolved: int = 0
    rejected: int = 0

class PriorityBreakdown(BaseModel):
    low: int = 0
    medium: int = 0
    high: int = 0
    critical: int = 0

class DashboardStats(BaseModel):
    total_petitions: int
    status_breakdown: StatusBreakdown
    priority_breakdown: PriorityBreakdown
    pending_count: int
    duplicate_count: int

class AdminStats(BaseModel):
    total_petitions: int
    resolved_petitions: int
    active_officers: int
    total_departments: int

class ChartPoint(BaseModel):
    date: str
    count: int

class StatusCount(BaseModel):
    status: str
    count: int

class CategoryCount(BaseModel):
    category: str
    count: int

class OfficerAnalyticsResponse(BaseModel):
    officer_id: Any
    officer_name: str
    department_name: str | None
    total_assigned: int
    pending: int
    in_progress: int
    resolved: int
    rejected: int
    duplicate: int
    withdrawn: int
    active_workload: int
    resolution_rate: float
    average_resolution_days: float | None = None
    priority_breakdown: dict[str, int] = {}
    is_demo: bool = False

class AdminCharts(BaseModel):
    trend: list[ChartPoint]
    by_status: list[StatusCount]
    by_category: list[CategoryCount]

class AnalyticsOut(BaseModel):
    stats: AdminStats
    charts: AdminCharts
    mapData: list[Any]
