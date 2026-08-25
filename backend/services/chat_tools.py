"""
services/chat_tools.py

Tool Calling Layer for the InsightGov Chatbot.

The LLM must never hallucinate live information (petition status, department
details, etc.). Instead, ChatService uses these tool functions to retrieve
live data from the database and inject it into the LLM context.

CRITICAL: These tools perform READ-ONLY database queries.
          They MUST NOT write to the database.
          They MUST NOT call the Ollama AI pipeline.
          They MUST NOT access ChromaDB petition embeddings.
"""
from __future__ import annotations

import logging
from uuid import UUID

from sqlalchemy.orm import Session

from models.petition import Petition
from models.department import Department
from models.notification import Notification
from models.user import User

logger = logging.getLogger(__name__)


class ChatTools:
    """
    Read-only data retrieval tools for the chatbot.

    Each method returns a plain dict or string suitable for injection
    into the LLM context window. Never returns ORM objects directly.
    """

    def __init__(self, db: Session) -> None:
        self._db = db

    # -------------------------------------------------------------------
    # Tool: Petition Status Lookup
    # -------------------------------------------------------------------
    def get_petition_status(
        self, petition_id_str: str, requesting_user_id: UUID
    ) -> dict:
        """
        Returns the current status and basic metadata of a petition.
        Only returns petitions owned by the requesting user (citizens)
        or any petition (officers/admins). Citizenship check is done
        by the caller (ChatService).

        Returns a plain dict safe to pass directly to the LLM context.
        """
        try:
            pid = UUID(petition_id_str)
        except ValueError:
            return {"error": "Invalid petition ID format."}

        petition: Petition | None = (
            self._db.query(Petition).filter(Petition.id == pid).first()
        )
        if not petition:
            return {"error": f"No petition found with ID {petition_id_str}."}

        return {
            "id": str(petition.id),
            "title": petition.title,
            "status": petition.status,
            "location": petition.location,
            "submitted_at": petition.created_at.isoformat(),
            "last_updated": petition.updated_at.isoformat(),
            "is_duplicate": petition.is_duplicate,
        }

    # -------------------------------------------------------------------
    # Tool: Petition Timeline
    # -------------------------------------------------------------------
    def get_petition_timeline(
        self, petition_id_str: str
    ) -> dict:
        """
        Returns the status history of a petition as a chronological list.
        """
        try:
            pid = UUID(petition_id_str)
        except ValueError:
            return {"error": "Invalid petition ID format."}

        petition: Petition | None = (
            self._db.query(Petition)
            .filter(Petition.id == pid)
            .first()
        )
        if not petition:
            return {"error": "Petition not found."}

        history = []
        for entry in sorted(petition.history, key=lambda h: h.created_at):
            history.append({
                "from_status": entry.old_status,
                "to_status": entry.new_status,
                "note": entry.note,
                "changed_at": entry.created_at.isoformat(),
                "officer": entry.officer.name if entry.officer else None,
            })

        return {
            "petition_id": str(pid),
            "title": petition.title,
            "current_status": petition.status,
            "timeline": history,
        }

    # -------------------------------------------------------------------
    # Tool: Department Information
    # -------------------------------------------------------------------
    def get_department_info(self, department_name: str | None = None) -> dict:
        """
        Returns department information. If name is provided, returns
        details for that specific department. Otherwise returns the full list.
        """
        if department_name:
            dept: Department | None = (
                self._db.query(Department)
                .filter(Department.name.ilike(f"%{department_name}%"))
                .first()
            )
            if not dept:
                return {"error": f"Department '{department_name}' not found."}
            return {"id": str(dept.id), "name": dept.name}

        all_depts = self._db.query(Department).order_by(Department.name).all()
        return {
            "total": len(all_depts),
            "departments": [d.name for d in all_depts],
        }

    # -------------------------------------------------------------------
    # Tool: User Profile (read-only summary)
    # -------------------------------------------------------------------
    def get_user_profile(self, user_id: UUID) -> dict:
        """Returns a safe, read-only user profile summary."""
        user: User | None = (
            self._db.query(User).filter(User.id == user_id).first()
        )
        if not user:
            return {"error": "User not found."}

        return {
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "department": user.department.name if user.department else None,
            "member_since": user.created_at.strftime("%B %Y"),
        }

    # -------------------------------------------------------------------
    # Tool: Notification Summary
    # -------------------------------------------------------------------
    def get_notification_summary(self, user_id: UUID) -> dict:
        """Returns unread notification count and latest 3 messages."""
        notifications = (
            self._db.query(Notification)
            .filter(
                Notification.user_id == user_id,
            )
            .order_by(Notification.created_at.desc())
            .limit(5)
            .all()
        )
        unread = sum(1 for n in notifications if not n.is_read)
        return {
            "unread_count": unread,
            "recent": [
                {
                    "message": n.message,
                    "is_read": n.is_read,
                    "time": n.created_at.isoformat(),
                }
                for n in notifications
            ],
        }

    # -------------------------------------------------------------------
    # Tool: FAQ / Static Guidance
    # -------------------------------------------------------------------
    def get_faq_context(self, topic: str) -> str:
        """
        Returns static FAQ text for common topics.
        Phase 2: this will be replaced by a ChromaDB RAG lookup against
        the 'insightgov_faq' collection (never the petition embeddings).
        """
        FAQ: dict[str, str] = {
            "submit": (
                "To submit a petition: Log in → Citizen Dashboard → Submit Petition → "
                "Fill title, description, location → Optionally pin on map → Submit."
            ),
            "status": (
                "Petition statuses: Pending (awaiting AI) → Analysed (AI routed it) → "
                "Under Review (officer reviewing) → Resolved or Rejected (terminal states)."
            ),
            "duplicate": (
                "Duplicate detection uses two factors: (1) proximity within 200 meters "
                "of another petition, and (2) similar problem title. Both must match for a "
                "duplicate flag. The AI handles this automatically."
            ),
            "department": (
                "InsightGov routes petitions to one of 42 official Tamil Nadu state "
                "departments based on AI category prediction. Officers can manually override "
                "the routing if the AI made an error."
            ),
            "officer": (
                "Officers cannot be created by citizens. An Admin creates officer accounts "
                "and assigns them to departments. Officers see petitions routed to their department."
            ),
        }
        for key, text in FAQ.items():
            if key in topic.lower():
                return text
        return "I can help with petition submission, status tracking, departments, and general guidance."
