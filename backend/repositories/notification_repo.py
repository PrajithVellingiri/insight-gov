from uuid import UUID

from sqlalchemy.orm import Session

from models.notification import Notification


class NotificationRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_by_user(
        self, user_id: UUID, skip: int = 0, limit: int = 50
    ) -> list[Notification]:
        return (
            self._db.query(Notification)
            .filter(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create(self, notification: Notification) -> Notification:
        self._db.add(notification)
        self._db.commit()
        self._db.refresh(notification)
        return notification

    def mark_read(self, notification_id: UUID, user_id: UUID) -> Notification | None:
        notification = (
            self._db.query(Notification)
            .filter(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
            .first()
        )
        if notification:
            notification.is_read = True
            self._db.commit()
            self._db.refresh(notification)
        return notification

    def count_unread(self, user_id: UUID) -> int:
        return (
            self._db.query(Notification)
            .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
            .count()
        )
