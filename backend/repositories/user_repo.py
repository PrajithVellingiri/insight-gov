from uuid import UUID

from sqlalchemy.orm import Session

from models.user import User
from models.petition import Petition


class UserRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_by_id(self, user_id: UUID) -> User | None:
        return self._db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> User | None:
        return self._db.query(User).filter(User.email == email).first()

    def create(self, user: User) -> User:
        self._db.add(user)
        self._db.commit()
        self._db.refresh(user)
        return user

    def get_officers(self, department_id: UUID | None = None) -> list[User]:
        query = self._db.query(User).filter(User.role == "officer")
        if department_id:
            query = query.filter(User.department_id == department_id)
        return query.order_by(User.name).all()

    def delete_officer(self, user_id: UUID) -> bool:
        """
        Delete an officer. Returns True if deleted, False if dependencies exist
        (e.g., they have petitions assigned to them).
        """
        has_petitions = self._db.query(Petition).filter(Petition.officer_id == user_id).first() is not None
        
        if has_petitions:
            return False
            
        user = self.get_by_id(user_id)
        if user and user.role == "officer":
            self._db.delete(user)
            self._db.commit()
        return True
