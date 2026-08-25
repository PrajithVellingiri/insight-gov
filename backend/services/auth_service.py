from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from config import settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Handles password hashing and JWT token lifecycle."""

    # ------------------------------------------------------------------
    # Password helpers
    # ------------------------------------------------------------------

    @staticmethod
    def hash_password(plain: str) -> str:
        return _pwd_context.hash(plain)

    @staticmethod
    def verify_password(plain: str, hashed: str) -> bool:
        return _pwd_context.verify(plain, hashed)

    # ------------------------------------------------------------------
    # JWT helpers
    # ------------------------------------------------------------------

    @staticmethod
    def create_access_token(subject: str, role: str) -> str:
        """Create a signed JWT with `sub` (user id) and `role` claims."""
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
        payload = {
            "sub": subject,
            "role": role,
            "exp": expire,
        }
        return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)

    @staticmethod
    def decode_token(token: str) -> dict:
        """Decode and validate a JWT. Raises JWTError on failure."""
        return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
