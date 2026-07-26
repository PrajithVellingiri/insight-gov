from uuid import UUID

from sqlalchemy.orm import Session

from models.ai_analysis import AIAnalysis


class AIAnalysisRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(self, analysis: AIAnalysis) -> AIAnalysis:
        self._db.add(analysis)
        self._db.commit()
        self._db.refresh(analysis)
        return analysis

    def get_by_petition_id(self, petition_id: UUID) -> AIAnalysis | None:
        return (
            self._db.query(AIAnalysis)
            .filter(AIAnalysis.petition_id == petition_id)
            .first()
        )

    def get_all_categories(self) -> list[tuple[str, int]]:
        """Return list of (category, count) tuples for analytics."""
        from sqlalchemy import func
        return (
            self._db.query(AIAnalysis.category, func.count(AIAnalysis.id))
            .group_by(AIAnalysis.category)
            .all()
        )

    def get_all_departments(self) -> list[tuple[str, int]]:
        """Return list of (department, count) tuples for analytics."""
        from sqlalchemy import func
        return (
            self._db.query(AIAnalysis.department, func.count(AIAnalysis.id))
            .group_by(AIAnalysis.department)
            .all()
        )

    def get_all_priorities(self) -> list[tuple[str, int]]:
        """Return list of (priority, count) tuples for analytics."""
        from sqlalchemy import func
        return (
            self._db.query(AIAnalysis.priority, func.count(AIAnalysis.id))
            .group_by(AIAnalysis.priority)
            .all()
        )
