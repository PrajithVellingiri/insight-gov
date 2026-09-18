from datetime import datetime, timedelta, timezone
import bcrypt
from jose import jwt

from config import settings


class AuthService:
    """Handles password hashing and JWT token lifecycle."""

    # ------------------------------------------------------------------
    # Password helpers
    # ------------------------------------------------------------------

    @staticmethod
    def hash_password(plain: str) -> str:
        pwd_bytes = plain.encode("utf-8")
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

    @staticmethod
    def verify_password(plain: str, hashed: str) -> bool:
        try:
            return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
        except Exception:
            return False

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
