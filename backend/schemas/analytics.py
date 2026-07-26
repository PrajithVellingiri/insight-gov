from pydantic import BaseModel


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


class CategoryCount(BaseModel):
    category: str
    count: int


class DepartmentCount(BaseModel):
    department: str
    count: int


class AnalyticsOut(BaseModel):
    total_petitions: int
    status_breakdown: StatusBreakdown
    priority_breakdown: PriorityBreakdown
    category_distribution: list[CategoryCount]
    department_distribution: list[DepartmentCount]
    duplicate_count: int
    resolution_rate: float  # resolved / total (0.0–1.0)
