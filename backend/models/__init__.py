"""
SQLAlchemy ORM models — import all here so Alembic autogenerate picks them up.
"""
from models.department import Department
from models.user import User
from models.petition import Petition
from models.petition_image import PetitionImage
from models.ai_analysis import AIAnalysis
from models.notification import Notification
from models.petition_history import PetitionHistory
from models.chat_session import ChatSession
from models.chat_message import ChatMessage

__all__ = [
    "Department",
    "User",
    "Petition",
    "PetitionImage",
    "AIAnalysis",
    "Notification",
    "PetitionHistory",
    "ChatSession",
    "ChatMessage",
]
