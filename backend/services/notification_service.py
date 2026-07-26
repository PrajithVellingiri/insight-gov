from uuid import UUID

from sqlalchemy.orm import Session

from models.notification import Notification
from repositories.notification_repo import NotificationRepository
from schemas.notification import NotificationOut


class NotificationService:
    """Create and list notifications for a user."""

    def __init__(self, db: Session) -> None:
        self._repo = NotificationRepository(db)

    def get_for_user(self, user_id: UUID, skip: int = 0, limit: int = 50) -> list[NotificationOut]:
        notifications = self._repo.get_by_user(user_id, skip=skip, limit=limit)
        return [NotificationOut.model_validate(n) for n in notifications]

    def mark_read(self, notification_id: UUID, user_id: UUID) -> NotificationOut | None:
        notification = self._repo.mark_read(notification_id, user_id)
        if notification:
            return NotificationOut.model_validate(notification)
        return None

    def unread_count(self, user_id: UUID) -> int:
        return self._repo.count_unread(user_id)
