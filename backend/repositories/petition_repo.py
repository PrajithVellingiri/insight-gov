from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from models.petition import Petition
from models.ai_analysis import AIAnalysis

# Statuses treated as "finalized" for the 2-day Officer Dashboard retention rule
FINALIZED_STATUSES = ("resolved", "rejected", "duplicate")
# How long finalized petitions remain on the main Officer Dashboard
DASHBOARD_RETENTION_DAYS = 2


class PetitionRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(self, petition: Petition) -> Petition:
        self._db.add(petition)
        self._db.commit()
        self._db.refresh(petition)
        return petition

    def get_by_id(self, petition_id: UUID) -> Petition | None:
        return self._db.query(Petition).filter(Petition.id == petition_id).first()

    def get_all(
        self,
        status: str | None = None,
        priority: str | None = None,
        department_id: UUID | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Petition]:
        query = self._db.query(Petition)
        if priority:
            query = query.join(AIAnalysis).filter(AIAnalysis.priority == priority)
        if status:
            query = query.filter(Petition.status == status)
        if department_id:
            query = query.filter(Petition.department_id == department_id)
        return (
            query.order_by(Petition.created_at.desc()).offset(skip).limit(limit).all()
        )

    def get_active_for_officer(
        self,
        department_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Petition]:
        """
        Returns petitions for the officer's dashboard applying the 2-day retention rule:

        - All non-finalized petitions (pending, analysed, under_review, withdrawn) are
          always included.
        - Finalized petitions (resolved, rejected, duplicate) are included only if their
          updated_at timestamp is within the last DASHBOARD_RETENTION_DAYS days.

        The boundary uses server-side UTC time so the browser clock is never trusted.
        A petition finalized exactly at the boundary (updated_at == cutoff) is treated
        as still within the retention window (>=).
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=DASHBOARD_RETENTION_DAYS)

        query = self._db.query(Petition).filter(
            Petition.department_id == department_id,
            or_(
                # Non-finalized: always visible
                Petition.status.notin_(FINALIZED_STATUSES),
                # Finalized but recent: within retention window
                and_(
                    Petition.status.in_(FINALIZED_STATUSES),
                    Petition.updated_at >= cutoff,
                ),
            ),
        )
        return (
            query.order_by(Petition.created_at.desc()).offset(skip).limit(limit).all()
        )

    def get_resolution_history(
        self,
        department_id: UUID,
        status_filter: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Petition]:
        """
        Returns all finalized petitions (resolved / rejected / duplicate) for a
        given department, ordered newest-first.

        This is the complete historical record — it includes both recent finalized
        petitions (still on the dashboard) and older ones (past the 2-day window).

        If status_filter is supplied and is one of the finalized statuses, results
        are narrowed to that specific outcome.
        """
        query = self._db.query(Petition).filter(
            Petition.department_id == department_id,
            Petition.status.in_(FINALIZED_STATUSES),
        )
        if status_filter and status_filter in FINALIZED_STATUSES:
            query = query.filter(Petition.status == status_filter)
        return (
            query.order_by(Petition.updated_at.desc()).offset(skip).limit(limit).all()
        )

    def get_by_user(self, user_id: UUID, skip: int = 0, limit: int = 20) -> list[Petition]:
        return (
            self._db.query(Petition)
            .filter(Petition.submitted_by == user_id)
            .order_by(Petition.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update_status(self, petition: Petition, new_status: str) -> Petition:
        petition.status = new_status
        petition.updated_at = datetime.now(timezone.utc)
        self._db.commit()
        self._db.refresh(petition)
        return petition

    def update_fields(self, petition: Petition, **kwargs) -> Petition:
        for field, value in kwargs.items():
            setattr(petition, field, value)
        petition.updated_at = datetime.now(timezone.utc)
        self._db.commit()
        self._db.refresh(petition)
        return petition

    def count_all(self) -> int:
        return self._db.query(Petition).count()

    def count_by_status(self, status: str) -> int:
        return self._db.query(Petition).filter(Petition.status == status).count()

    def count_duplicates(self) -> int:
        return self._db.query(Petition).filter(Petition.is_duplicate.is_(True)).count()
