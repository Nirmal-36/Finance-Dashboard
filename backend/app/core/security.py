"""
Password hashing + JWT issuance/verification.

Auth model:
- Access token: short-lived (30 min default), sent on every request as
  `Authorization: Bearer <token>`, carries user id + role.
- Refresh token: long-lived (7 days default), used only to mint new access
  tokens via /auth/refresh. Stored hashed in the DB (refresh_tokens table)
  so it can be revoked (logout / token theft response).
- Device API keys: a separate mechanism for the Android Accessibility
  Service — see device_auth.py. Not JWTs, because the companion app
  authenticates as "this installation belonging to user X", not as a
  logged-in human session.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

TokenType = Literal["access", "refresh"]

# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------
# Using the `bcrypt` library directly rather than passlib's CryptContext:
# passlib's bcrypt backend does a version probe (`_bcrypt.__about__.__version__`)
# that breaks against recent bcrypt releases (>=4.1), raising
# "module 'bcrypt' has no attribute '__about__'" and then misfiring bcrypt's
# own 72-byte self-test. passlib is effectively unmaintained for this check,
# so we bypass it. bcrypt truncates at 72 bytes internally regardless, so we
# explicitly reject longer passwords up front with a clear error instead of
# silently truncating them (silent truncation means "mypassword1234...xyz"
# and "mypassword1234...abc" could hash identically past byte 72).

_MAX_PASSWORD_BYTES = 72


def hash_password(plain_password: str) -> str:
    password_bytes = plain_password.encode("utf-8")
    if len(password_bytes) > _MAX_PASSWORD_BYTES:
        raise ValueError(f"Password must be at most {_MAX_PASSWORD_BYTES} bytes")
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# ---------------------------------------------------------------------------
# JWT creation
# ---------------------------------------------------------------------------

def _create_token(subject: str, token_type: TokenType, expires_delta: timedelta, extra_claims: Optional[dict] = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,          # user id (as string)
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "jti": str(uuid.uuid4()),  # unique token id — lets us revoke individual refresh tokens
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(user_id: uuid.UUID, role: str) -> str:
    return _create_token(
        subject=str(user_id),
        token_type="access",
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        extra_claims={"role": role},
    )


def create_refresh_token(user_id: uuid.UUID) -> str:
    return _create_token(
        subject=str(user_id),
        token_type="refresh",
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )


# ---------------------------------------------------------------------------
# JWT verification
# ---------------------------------------------------------------------------

class TokenPayload:
    def __init__(self, user_id: str, role: Optional[str], token_type: str, jti: str, exp: int):
        self.user_id = user_id
        self.role = role
        self.token_type = token_type
        self.jti = jti
        self.exp = exp


def decode_token(token: str) -> Optional[TokenPayload]:
    """Returns the decoded payload, or None if the token is invalid/expired."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return TokenPayload(
            user_id=payload["sub"],
            role=payload.get("role"),
            token_type=payload["type"],
            jti=payload["jti"],
            exp=payload["exp"],
        )
    except JWTError:
        return None
