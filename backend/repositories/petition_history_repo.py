from uuid import UUID

from sqlalchemy.orm import Session

from models.petition_history import PetitionHistory


class PetitionHistoryRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(self, record: PetitionHistory) -> PetitionHistory:
        self._db.add(record)
        self._db.commit()
        self._db.refresh(record)
        return record

    def get_by_petition_id(self, petition_id: UUID) -> list[PetitionHistory]:
        return (
            self._db.query(PetitionHistory)
            .filter(PetitionHistory.petition_id == petition_id)
            .order_by(PetitionHistory.created_at.asc())
            .all()
        )
