"""
routers/chat.py

FastAPI router for all /chat/* endpoints.

Authentication:
  - All endpoints accept an optional JWT (anonymous users can still chat).
  - Petition status lookups are only performed for the authenticated user's
    own petitions (ChatService enforces this via ChatTools).

Rate limiting:
  - Anonymous: chat_rate_limit_anon messages/hour (default 20)
  - Authenticated: chat_rate_limit_user messages/hour (default 100)
"""
import json
import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from middleware.auth import get_current_user
from models.user import User
from schemas.chat import (
    ChatAnalyticsOut,
    ChatHistoryOut,
    ChatMessageIn,
    ChatMessageOut,
    FeedbackIn,
    FeedbackOut,
    SessionCreate,
    SessionOut,
)
from services.auth_service import AuthService
from services.chat_providers import get_chat_provider
from services.chat_service import ChatService
from limiter import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Chatbot"])

# Optional bearer — does not error if token is absent
_optional_bearer = HTTPBearer(auto_error=False)


def _get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Returns the current User if a valid JWT is provided, else None.
    Used by chat endpoints that support both anonymous and authenticated access.
    """
    if not credentials:
        return None
    try:
        payload = AuthService.decode_token(credentials.credentials)
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None
        from repositories.user_repo import UserRepository
        return UserRepository(db).get_by_id(UUID(user_id_str))
    except (JWTError, ValueError):
        return None


def _get_chat_service(db: Session = Depends(get_db)) -> ChatService:
    return ChatService(db=db, provider=get_chat_provider())


def get_chat_limit() -> str:
    """Returns the chat rate limit string for slowapi."""
    return f"{settings.chat_rate_limit_user}/hour"


# ---------------------------------------------------------------------------
# Session Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/sessions",
    response_model=SessionOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create or retrieve a chat session",
)
def create_session(
    _body: SessionCreate = SessionCreate(),
    current_user: Optional[User] = Depends(_get_optional_user),
    chat_service: ChatService = Depends(_get_chat_service),
) -> SessionOut:
    """
    Creates a new chat session or returns the existing active one for the user.
    Anonymous users (no JWT) get a session with user_id=NULL.
    """
    user_id = current_user.id if current_user else None
    session, is_new = chat_service.get_or_create_session(user_id=user_id)
    return SessionOut(
        session_id=session.id,
        created_at=session.created_at,
        is_new=is_new,
    )

@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear chat history (deactivates session)",
)
def clear_session(
    session_id: UUID,
    current_user: Optional[User] = Depends(_get_optional_user),
    chat_service: ChatService = Depends(_get_chat_service),
):
    """
    Safely clears chat history by deactivating the session.
    Preserves analytics data since rows are not hard-deleted.
    """
    user_id = current_user.id if current_user else None
    chat_service.deactivate_session(session_id, user_id)
    return None


# ---------------------------------------------------------------------------
# Message Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/message",
    response_model=ChatMessageOut,
    summary="Send a message (full response)",
)
@limiter.limit(get_chat_limit)
async def send_message(
    body: ChatMessageIn,
    request: Request,
    current_user: Optional[User] = Depends(_get_optional_user),
    chat_service: ChatService = Depends(_get_chat_service),
) -> ChatMessageOut:
    
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    user_id = current_user.id if current_user else None

    try:
        result = await chat_service.send_message(
            session_id=body.session_id,
            user_message=body.message.strip(),
            language=body.language,
            user_id=user_id,
        )
        return result
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.error("Chat message error: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=503,
            detail="The AI assistant is temporarily unavailable. Please try again.",
        )


@router.post(
    "/message/stream",
    summary="Send a message (Server-Sent Events stream)",
    responses={
        200: {
            "description": "SSE token stream",
            "content": {"text/event-stream": {}},
        }
    },
)
@limiter.limit(get_chat_limit)
async def stream_message(
    body: ChatMessageIn,
    request: Request,
    current_user: Optional[User] = Depends(_get_optional_user),
    chat_service: ChatService = Depends(_get_chat_service),
) -> StreamingResponse:
    """
    Send a message and receive the response as a Server-Sent Events stream.

    Each SSE event is a JSON object:
      - Token chunk: `data: {"token": "Hello"}`
      - Completion:  `data: {"done": true, "message_id": "uuid"}`
      - Error:       `data: {"error": "timeout", "done": true}`

    Set `X-Accel-Buffering: no` header to prevent nginx from buffering the stream.
    """
    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    user_id = current_user.id if current_user else None

    async def event_generator():
        try:
            print("[1] Chat request received in router", flush=True)
            async for chunk in chat_service.stream_message(
                session_id=body.session_id,
                user_message=body.message.strip(),
                language=body.language,
                user_id=user_id,
            ):
                yield f"data: {chunk}\n\n"
            print("[9] Streaming completed from generator", flush=True)
        except ValueError as exc:
            yield f"data: {json.dumps({'error': str(exc), 'done': True})}\n\n"
        except Exception as exc:
            logger.error("Stream error: %s", exc, exc_info=True)
            yield f"data: {json.dumps({'error': 'unavailable', 'done': True})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# History Endpoint
# ---------------------------------------------------------------------------

@router.get(
    "/history",
    response_model=ChatHistoryOut,
    summary="Get conversation history for a session",
)
def get_history(
    session_id: UUID = Query(..., description="The chat session UUID."),
    limit: int = Query(50, ge=1, le=200),
    current_user: Optional[User] = Depends(_get_optional_user),
    chat_service: ChatService = Depends(_get_chat_service),
) -> ChatHistoryOut:
    #Returns paginated message history for a session.
    #Returns paginated message history for a session.
    return chat_service.get_history(session_id=session_id, limit=limit)


# ---------------------------------------------------------------------------
# Feedback Endpoint
# ---------------------------------------------------------------------------

@router.post(
    "/feedback/{message_id}",
    response_model=FeedbackOut,
    summary="Submit feedback for an assistant message",
)
def submit_feedback(
    message_id: UUID,
    body: FeedbackIn,
    current_user: Optional[User] = Depends(_get_optional_user),
    chat_service: ChatService = Depends(_get_chat_service),
) -> FeedbackOut:
    #Record feedback and optional written comment for a message.
    try:
        return chat_service.record_feedback(
            message_id=message_id,
            rating=body.rating,
            feedback_text=body.feedback_text,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


# ---------------------------------------------------------------------------
# Admin Analytics Endpoint
# ---------------------------------------------------------------------------

@router.get(
    "/analytics",
    response_model=ChatAnalyticsOut,
    summary="Chatbot analytics (Admin only)",
)
def get_chat_analytics(
    current_user: User = Depends(get_current_user),
    chat_service: ChatService = Depends(_get_chat_service),
) -> ChatAnalyticsOut:
    """Returns aggregated chatbot usage metrics. Admin role required."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return chat_service.get_analytics()
