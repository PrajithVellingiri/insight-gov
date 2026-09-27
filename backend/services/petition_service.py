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
from services.storage import get_storage_provider, StorageError

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
        """Create, analyse, and return a petition with transactional image handling."""
        import uuid as uuid_mod
        from models.petition_image import PetitionImage
        from services.storage import get_storage_provider, StorageError

        # 1. Validate files upfront
        if len(files) == 0:
            raise ValueError("At least one image is required.")
        if len(files) > 5:
            raise ValueError("Maximum 5 images allowed per petition.")

        allowed_mimes = {"image/jpeg", "image/png", "image/webp"}
        max_size_bytes = 5 * 1024 * 1024

        read_files_data: list[tuple[bytes, str, str]] = []
        for file in files:
            content_type = getattr(file, "content_type", None) or "image/jpeg"
            if content_type not in allowed_mimes:
                raise ValueError(f"Unsupported file type '{content_type}'. Allowed: JPG, PNG, WebP.")

            content = await file.read() if hasattr(file, "read") else file.file.read()
            if len(content) > max_size_bytes:
                orig_name = getattr(file, "filename", "file")
                raise ValueError(f"File '{orig_name}' exceeds the 5 MB limit.")

            orig_filename = getattr(file, "filename", None) or "evidence.jpg"
            read_files_data.append((content, orig_filename, content_type))

        # 2. Pre-generate petition UUID
        petition_id = uuid_mod.uuid4()

        # 3. Calculate location integrity status
        ver_status = "UNAVAILABLE"
        ver_reason = None
        ver_time = None

        loc_status = "unavailable"
        if data.latitude is not None and data.longitude is not None:
            loc_status = "unverified"

        # Calculate verification based on device coordinates
        if (
            data.latitude is not None
            and data.longitude is not None
            and data.device_latitude is not None
            and data.device_longitude is not None
        ):
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

        # 4. Upload files to storage provider sequentially with error cleanup
        storage = get_storage_provider()
        uploaded_records: list[dict] = []
        uploaded_paths: list[str] = []

        try:
            for content, orig_filename, content_type in read_files_data:
                ext = "jpg"
                if "." in orig_filename:
                    ext = orig_filename.rsplit(".", 1)[-1].lower()
                safe_uuid = uuid_mod.uuid4().hex
                dest_path = f"{petition_id}/petition/{safe_uuid}.{ext}"

                stored_path = await storage.save_file(content, dest_path, content_type)
                uploaded_paths.append(stored_path)

                uploaded_records.append({
                    "filename": orig_filename,
                    "stored_path": stored_path,
                    "mime_type": content_type,
                    "file_size": len(content),
                    "image_type": "petition",
                })
        except Exception as upload_exc:
            logger.error(
                "Image upload failed for petition %s. Rolling back %d uploaded files: %s",
                petition_id,
                len(uploaded_paths),
                upload_exc,
            )
            for path in uploaded_paths:
                try:
                    await storage.delete_file(path)
                except Exception as del_err:
                    logger.warning("Failed to clean up uploaded file '%s': %s", path, del_err)
            raise StorageError(f"Unable to store petition evidence: {str(upload_exc)}") from upload_exc

        # 5. Database Transaction: Insert Petition + PetitionImage rows atomically
        try:
            petition = Petition(
                id=petition_id,
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
            self._db.add(petition)

            for rec in uploaded_records:
                img = PetitionImage(
                    petition_id=petition_id,
                    filename=rec["filename"],
                    stored_path=rec["stored_path"],
                    mime_type=rec["mime_type"],
                    file_size=rec["file_size"],
                    image_type=rec["image_type"],
                )
                self._db.add(img)

            self._db.commit()
            self._db.refresh(petition)
            logger.info("Petition %s and %d images committed atomically", petition.id, len(uploaded_records))
        except Exception as db_exc:
            self._db.rollback()
            logger.error(
                "Database commit failed for petition %s. Rolling back %d uploaded files: %s",
                petition_id,
                len(uploaded_paths),
                db_exc,
            )
            for path in uploaded_paths:
                try:
                    await storage.delete_file(path)
                except Exception as del_err:
                    logger.warning(
                        "Failed to clean up uploaded file '%s' after DB failure: %s", path, del_err
                    )
            raise RuntimeError(f"Database error while saving petition: {str(db_exc)}") from db_exc

        # 6. Execute AI analysis task synchronously
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

        # 1. Fetch image bytes for Vision AI if available
        first_img = next((img for img in (petition.images or []) if img.image_type == 'petition'), None)
        image_bytes: bytes | None = None
        image_mime: str = "image/jpeg"
        if first_img:
            image_mime = first_img.mime_type or "image/jpeg"
            try:
                storage = get_storage_provider()
                local_path = storage.get_local_path(first_img.stored_path)
                if local_path and local_path.is_file():
                    image_bytes = local_path.read_bytes()
                else:
                    image_bytes = await storage.get_file_bytes(first_img.stored_path)
            except Exception as read_err:
                logger.warning("Could not read image bytes for petition %s AI vision: %s", petition_id, read_err)

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
            if image_bytes:
                # Use the first image for Vision Intelligence
                try:
                    vision_provider = get_vision_provider()
                    vision_context = f"Title: {translated_title}\nDescription: {translated_description}"
                    vision_result = await vision_provider.analyze_image(image_bytes, image_mime, vision_context)
                    
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

