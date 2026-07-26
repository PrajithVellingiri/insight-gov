from sqlalchemy.orm import Session

from models.department import Department


class DepartmentRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_all(self) -> list[Department]:
        return self._db.query(Department).order_by(Department.name).all()

    def get_by_name(self, name: str) -> Department | None:
        return self._db.query(Department).filter(Department.name == name).first()

    def create(self, department: Department) -> Department:
        self._db.add(department)
        self._db.commit()
        self._db.refresh(department)
        return department

    def get_or_create(self, name: str) -> Department:
        """Return existing department by name, or create it if not found."""
        existing = self.get_by_name(name)
        if existing:
            return existing
        dept = Department(name=name)
        return self.create(dept)
