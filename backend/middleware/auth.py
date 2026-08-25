from uuid import UUID

from fastapi import Depends, HTTPException, status, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from repositories.user_repo import UserRepository
from services.auth_service import AuthService

_bearer = HTTPBearer(auto_error=True)


def _verify_and_get_user(token: str, db: Session) -> User:
    try:
        payload = AuthService.decode_token(token)
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload.",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or has expired.",
        )

    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format in token.",
        )

    user = UserRepository(db).get_by_id(user_uuid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency — decodes JWT and returns the authenticated User object.
    Raises 401 if the token is missing, expired, or invalid.
    """
    return _verify_and_get_user(credentials.credentials, db)


def get_current_user_from_token(
    token: str = Query(..., description="JWT access token"),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency — authenticates using a raw token string (e.g. from a query param).
    """
    return _verify_and_get_user(token, db)


def require_officer(current_user: User = Depends(get_current_user)) -> User:
    """Raises 403 if the authenticated user is not an officer or admin."""
    if current_user.role not in ("officer", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Officer or admin access required.",
        )
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Raises 403 if the authenticated user is not an admin."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return current_user


def require_citizen(current_user: User = Depends(get_current_user)) -> User:
    """Raises 403 if the authenticated user is not a citizen."""
    if current_user.role != "citizen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Citizen access required.",
        )
    return current_user
