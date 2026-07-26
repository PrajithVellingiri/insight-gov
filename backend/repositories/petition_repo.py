from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from models.petition import Petition
from models.ai_analysis import AIAnalysis


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
