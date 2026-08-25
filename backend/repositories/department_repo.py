from uuid import UUID

from sqlalchemy.orm import Session

from models.department import Department


class DepartmentRepository:
    def __init__(self, db: Session):
        self._db = db

    def get_all(self) -> list[Department]:
        return self._db.query(Department).all()

    def get_by_id(self, dept_id: UUID) -> Department | None:
        return self._db.query(Department).filter(Department.id == dept_id).first()

    def get_by_name(self, name: str) -> Department | None:
        return self._db.query(Department).filter(Department.name == name).first()

    def create(self, department: Department) -> Department:
        # Auto-generate department code if not provided
        if not department.department_code:
            from sqlalchemy import func
            # Simple fallback for now (TN001, TN002, etc.)
            max_code = self._db.query(func.max(Department.department_code)).scalar()
            if max_code and max_code.startswith("TN"):
                try:
                    next_num = int(max_code[2:]) + 1
                    department.department_code = f"TN{next_num:03d}"
                except ValueError:
                    count = self._db.query(Department).count()
                    department.department_code = f"TN{count + 1:03d}"
            else:
                count = self._db.query(Department).count()
                department.department_code = f"TN{count + 1:03d}"

        self._db.add(department)
        self._db.commit()
        self._db.refresh(department)
        return department

    def delete(self, dept_id: UUID) -> bool:
        dept = self.get_by_id(dept_id)
        if not dept:
            return False
        self._db.delete(dept)
        self._db.commit()
        return True
