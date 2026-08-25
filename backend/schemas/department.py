from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DepartmentCreate(BaseModel):
    name: str
    department_code: str


class DepartmentOut(BaseModel):
    id: UUID
    department_code: str
    name: str
    created_at: datetime

    class Config:
        from_attributes = True
