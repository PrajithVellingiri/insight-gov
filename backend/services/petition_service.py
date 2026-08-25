import logging
import math
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from config import settings
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
from services.chat_providers import get_chat_provider
from services.vision_providers import get_vision_provider

logger = logging.getLogger(__name__)

# Statuses in which a citizen may still withdraw their petition
_WITHDRAWABLE_STATUSES = ("pending", "analysed")


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371e3  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c



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
        self, data: PetitionCreate, files: list, citizen_id: UUID, citizen_name: str
    ) -> Petition:
        """Create, analyse, and return a petition."""

        # Calculate location integrity status
        ver_status = "UNAVAILABLE"
        ver_reason = None
        ver_time = None
        
        # Legacy location status
        loc_status = "unavailable"
        if data.latitude is not None and data.longitude is not None:
            loc_status = "unverified"

        # Phase 7: Calculate verification based on device coordinates
        if data.latitude is not None and data.longitude is not None and data.device_latitude is not None and data.device_longitude is not None:
            distance = haversine_distance(
                data.latitude, data.longitude,
                data.device_latitude, data.device_longitude
            )
            threshold = getattr(settings, "location_verification_threshold_meters", 500.0)
            ver_time = datetime.now(timezone.utc)
            
            if distance <= threshold:
                ver_status = "VERIFIED"
                ver_reason = f"Distance between submitted and device location is {distance:.1f}m (<= {threshold}m)."
            else:
                ver_status = "MISMATCH"
                ver_reason = f"Mismatch: Device is {distance:.1f}m away from the submitted location (threshold: {threshold}m)."
        elif data.device_latitude is None or data.device_longitude is None:
            ver_status = "UNAVAILABLE"
            ver_reason = "Device geolocation was not available or permission was denied."

        petition = Petition(
            title=data.title,
            description=data.description,
            location=data.location,
            latitude=data.latitude,
            longitude=data.longitude,
            location_source=data.location_source,
            location_accuracy=data.location_accuracy,
            location_status=loc_status,
            device_latitude=data.device_latitude,
            device_longitude=data.device_longitude,
            device_accuracy=data.device_accuracy,
            location_verification_status=ver_status,
            location_verification_reason=ver_reason,
            location_verified_at=ver_time,
            citizen_department_id=data.citizen_department_id,
            submitted_by=citizen_id,
            status="pending",
        )
        petition = self._petition_repo.create(petition)
        logger.info("Petition %s created (status=pending)", petition.id)

        # 1.5 Save images
        from pathlib import Path
        import shutil
        import uuid
        from models.petition_image import PetitionImage
        
        upload_dir = Path(settings.upload_dir) / "petition_images" / str(petition.id)
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        uploaded_image_paths = []
        for file in files:
            file_extension = Path(file.filename).suffix if file.filename else ".jpg"
            # Fully sanitized filename
            safe_filename = f"{uuid.uuid4().hex}{file_extension}"
            file_path = upload_dir / safe_filename
            
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            img = PetitionImage(
                petition_id=petition.id,
                filename=file.filename or 'image.jpg',  # original name for reference if needed
                stored_path=f"petition_images/{petition.id}/{safe_filename}",
                mime_type=file.content_type,
                file_size=file.size,
                image_type="petition",
            )
            self._db.add(img)
            uploaded_image_paths.append((file_path, file.content_type))
        self._db.commit()

        # Execute AI analysis task synchronously
        await self.process_ai_analysis_task(petition.id, citizen_name)

        return petition

    def withdraw_petition(
        self,
        petition: Petition,
        citizen_id: UUID,
        reason: str,
    ) -> Petition:
        """
        Citizen withdraws their petition before officer processing begins.
        Only allowed when status is 'pending' or 'analysed'.
        """
        if petition.status not in _WITHDRAWABLE_STATUSES:
            raise ValueError(
                f"Cannot withdraw a petition with status '{petition.status}'. "
                "Withdrawal is only allowed before an officer begins review."
            )

        old_status = petition.status

        petition = self._petition_repo.update_fields(
            petition,
            status="withdrawn",
            withdrawal_reason=reason,
        )
        logger.info("Petition %s withdrawn by citizen %s.", petition.id, citizen_id)

        # History record
        self._history_repo.create(
            PetitionHistory(
                petition_id=petition.id,
                officer_id=None,
                old_status=old_status,
                new_status="withdrawn",
                note=f"Withdrawn by citizen. Reason: {reason}",
            )
        )

        # Confirmation notification
        self._notification_repo.create(
            Notification(
                user_id=citizen_id,
                message=f"Your petition \"{petition.title}\" has been withdrawn.",
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
        if new_status == "resolved":
            if not note or not note.strip():
                raise ValueError("Resolution text is required.")
            
            # Check for resolution image
            has_res_image = any(img.image_type == "resolution" for img in petition.images)
            if not has_res_image:
                raise ValueError("Resolution proof image is required.")

        old_status = petition.status

        # Apply overrides to ai_analysis if provided
        if department_override:
            dept = self._department_repo.get_by_name(department_override)
            if dept:
                petition.department_id = dept.id
            else:
                logger.warning(
                    "Officer attempted to override department to unknown department '%s' for petition %s.",
                    department_override,
                    petition.id,
                )
            if petition.ai_analysis:
                petition.ai_analysis.department = department_override
        if priority_override and petition.ai_analysis:
            petition.ai_analysis.priority = priority_override
            petition.ai_analysis.is_priority_overridden = True
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

    def _escalate_priority(self, current_priority: str, duplicate_count: int) -> str:
        """Calculate escalated priority based on duplicate count config thresholds."""
        weights = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        current_weight = weights.get(current_priority.lower(), 1)
        
        target_weight = 1
        if duplicate_count >= settings.priority_threshold_critical:
            target_weight = 4
        elif duplicate_count >= settings.priority_threshold_high:
            target_weight = 3
        elif duplicate_count >= settings.priority_threshold_medium:
            target_weight = 2
            
        final_weight = max(current_weight, target_weight)
        return {1: "low", 2: "medium", 3: "high", 4: "critical"}[final_weight]

    async def process_ai_analysis_task(self, petition_id: UUID, citizen_name: str):
        petition = self._petition_repo.get_by_id(petition_id)
        if not petition:
            logger.error("Petition %s not found for AI analysis task.", petition_id)
            return

        if petition.status != "pending":
            logger.info("Petition %s already processed (status: %s)", petition_id, petition.status)
            return
            
        if self._ai_analysis_repo.get_by_petition_id(petition_id):
            logger.info("Petition %s already has AI analysis.", petition_id)
            return

        uploaded_image_paths = []
        if petition.images:
            from pathlib import Path
            for img in petition.images:
                if img.image_type == 'petition':
                    file_path = Path(settings.upload_dir) / img.stored_path
                    if file_path.exists():
                        uploaded_image_paths.append((file_path, img.mime_type))

        # 2. Call AI service
        provider = get_chat_provider()
        translated_title = await provider.translate(petition.title, "en")
        translated_description = await provider.translate(petition.description, "en")
        translated_location = await provider.translate(petition.location, "en")
        
        analysis_data = await self._ai_client.analyze(
            petition_id=str(petition.id),
            title=translated_title,
            description=translated_description,
            location=translated_location,
            submitted_by=citizen_name,
            latitude=petition.latitude,
            longitude=petition.longitude,
        )

        if analysis_data:
            # Check if there are uploaded images for Vision AI processing
            if uploaded_image_paths:
                # Use the first image for Vision Intelligence
                first_image_path, first_mime = uploaded_image_paths[0]
                try:
                    vision_provider = get_vision_provider()
                    image_bytes = first_image_path.read_bytes()
                    vision_context = f"Title: {translated_title}\nDescription: {translated_description}"
                    vision_result = await vision_provider.analyze_image(image_bytes, first_mime, vision_context)
                    
                    if vision_result:
                        explanation_dict = analysis_data.get("explanation", {})
                        if vision_result.get("visual_evidence"):
                            explanation_dict["image_evidence_reason"] = vision_result["visual_evidence"]
                        if vision_result.get("relevance"):
                            explanation_dict["image_relevance"] = vision_result["relevance"]
                        analysis_data["explanation"] = explanation_dict
                except Exception as e:
                    logger.error("Vision AI processing failed for petition %s: %s", petition.id, e)

            # 3. Store AI analysis
            try:
                analyzed_at = datetime.fromisoformat(analysis_data["analyzed_at"].replace("Z", "+00:00"))
            except (ValueError, KeyError, TypeError):
                analyzed_at = datetime.now(timezone.utc)

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
                analyzed_at=analyzed_at,
            )
            self._ai_analysis_repo.create(analysis)

            # Phase 4: Duplicate Count and Priority Escalation
            duplicate_ids = analysis_data.get("duplicate_ids", [])
            for master_id_str in duplicate_ids:
                master_id = UUID(master_id_str)
                master_petition = self._petition_repo.get_by_id(master_id)
                if master_petition:
                    master_petition.duplicate_count += 1
                    
                    if master_petition.ai_analysis and not master_petition.ai_analysis.is_priority_overridden:
                        new_priority = self._escalate_priority(
                            master_petition.ai_analysis.priority, 
                            master_petition.duplicate_count
                        )
                        master_petition.ai_analysis.priority = new_priority
                        
                    self._petition_repo._db.commit()

            # 4. Update petition: status, department, is_duplicate, department_match
            dept = self._department_repo.get_by_name(analysis_data["department"])
            dept_id = dept.id if dept else None
            
            department_match = None
            if petition.citizen_department_id and dept_id:
                department_match = (petition.citizen_department_id == dept_id)
            
            if not dept:
                logger.warning(
                    "AI analysis returned unknown department '%s' for petition %s. Keeping department unassigned.",
                    analysis_data["department"],
                    petition.id,
                )

            is_dup = bool(analysis_data.get("duplicate_ids"))
            petition = self._petition_repo.update_fields(
                petition,
                status="analysed",
                department_id=dept_id,
                is_duplicate=is_dup,
                department_match=department_match,
            )
            logger.info(
                "Petition %s analysed — category=%s priority=%s duplicate=%s department_assigned=%s",
                petition.id,
                analysis_data["category"],
                analysis_data["priority"],
                is_dup,
                bool(dept),
            )
        else:
            logger.warning(
                "AI analysis failed for petition %s — keeping status=pending",
                petition.id,
            )

        # 5. Citizen notification
        self._notification_repo.create(
            Notification(
                user_id=petition.submitted_by,
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

