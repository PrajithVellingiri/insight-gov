import logging
from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from models.ai_analysis import AIAnalysis
from models.notification import Notification
from models.petition import Petition
from models.petition_history import PetitionHistory
from repositories.ai_analysis_repo import AIAnalysisRepository
from repositories.department_repo import DepartmentRepository
from repositories.notification_repo import NotificationRepository
from repositories.petition_history_repo import PetitionHistoryRepository
from repositories.petition_repo import PetitionRepository
from schemas.petition import PetitionCreate
from services.ai_client import AIClient

logger = logging.getLogger(__name__)


class PetitionService:
    """
    Orchestrates the full petition submission lifecycle:
      1. Persist petition (status = pending)
      2. Call AI service
      3. Store AI analysis
      4. Update petition status, department, is_duplicate flag
      5. Create citizen notification
      6. Write petition history record
    """

    def __init__(self, db: Session) -> None:
        self._db = db
        self._petition_repo = PetitionRepository(db)
        self._ai_analysis_repo = AIAnalysisRepository(db)
        self._department_repo = DepartmentRepository(db)
        self._notification_repo = NotificationRepository(db)
        self._history_repo = PetitionHistoryRepository(db)
        self._ai_client = AIClient()

    async def create_petition(
        self, data: PetitionCreate, citizen_id: UUID, citizen_name: str
    ) -> Petition:
        """Create, analyse, and return a petition."""

        # 1. Persist petition with status = pending
        petition = Petition(
            title=data.title,
            description=data.description,
            location=data.location,
            submitted_by=citizen_id,
            status="pending",
        )
        petition = self._petition_repo.create(petition)
        logger.info("Petition %s created (status=pending)", petition.id)

        # 2. Call AI service
        analysis_data = await self._ai_client.analyze(
            petition_id=str(petition.id),
            title=petition.title,
            description=petition.description,
            location=petition.location,
            submitted_by=citizen_name,
        )

        if analysis_data:
            # 3. Store AI analysis
            analysis = AIAnalysis(
                petition_id=petition.id,
                category=analysis_data["category"],
                department=analysis_data["department"],
                priority=analysis_data["priority"],
                summary=analysis_data["summary"],
                duplicate_ids=analysis_data.get("duplicate_ids", []),
                similarity_scores=analysis_data.get("similarity_scores", []),
                explanation=analysis_data.get("explanation", {}),
                confidence=analysis_data["confidence"],
                analyzed_at=datetime.fromisoformat(
                    analysis_data["analyzed_at"].replace("Z", "+00:00")
                ),
            )
            self._ai_analysis_repo.create(analysis)

            # 4. Update petition: status, department, is_duplicate
            dept = self._department_repo.get_or_create(analysis_data["department"])
            is_dup = bool(analysis_data.get("duplicate_ids"))
            petition = self._petition_repo.update_fields(
                petition,
                status="analysed",
                department_id=dept.id,
                is_duplicate=is_dup,
            )
            logger.info(
                "Petition %s analysed — category=%s priority=%s duplicate=%s",
                petition.id,
                analysis_data["category"],
                analysis_data["priority"],
                is_dup,
            )
        else:
            logger.warning(
                "AI analysis failed for petition %s — keeping status=pending",
                petition.id,
            )

        # 5. Citizen notification
        self._notification_repo.create(
            Notification(
                user_id=citizen_id,
                message=(
                    f"Your petition \"{petition.title}\" has been submitted successfully."
                    + (" AI analysis is complete." if analysis_data else " It is pending AI analysis.")
                ),
            )
        )

        # 6. History record
        self._history_repo.create(
            PetitionHistory(
                petition_id=petition.id,
                officer_id=None,
                old_status=None,
                new_status=petition.status,
                note="Petition submitted by citizen.",
            )
        )

        self._db.refresh(petition)
        return petition

    def update_status(
        self,
        petition: Petition,
        new_status: str,
        officer_id: UUID,
        note: str | None = None,
        department_override: str | None = None,
        priority_override: str | None = None,
    ) -> Petition:
        """
        Officer updates petition status with optional AI suggestion overrides.
        Records history and notifies the citizen.
        """
        old_status = petition.status

        # Apply overrides to ai_analysis if provided
        if petition.ai_analysis:
            if department_override:
                petition.ai_analysis.department = department_override
                dept = self._department_repo.get_or_create(department_override)
                petition.department_id = dept.id
            if priority_override:
                petition.ai_analysis.priority = priority_override
            self._db.commit()

        petition = self._petition_repo.update_status(petition, new_status)

        # History
        self._history_repo.create(
            PetitionHistory(
                petition_id=petition.id,
                officer_id=officer_id,
                old_status=old_status,
                new_status=new_status,
                note=note,
            )
        )

        # Notify citizen
        self._notification_repo.create(
            Notification(
                user_id=petition.submitted_by,
                message=(
                    f"Your petition \"{petition.title}\" status has been updated to "
                    f"\"{new_status}\"."
                    + (f" Note: {note}" if note else "")
                ),
            )
        )

        self._db.refresh(petition)
        return petition
