"""
SQLAlchemy ORM models — import all here so Alembic autogenerate picks them up.
"""
from models.department import Department
from models.user import User
from models.petition import Petition
from models.ai_analysis import AIAnalysis
from models.notification import Notification
from models.petition_history import PetitionHistory

__all__ = [
    "Department",
    "User",
    "Petition",
    "AIAnalysis",
    "Notification",
    "PetitionHistory",
]
