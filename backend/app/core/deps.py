"""
Reusable FastAPI dependencies for authentication and authorization.

Usage in a route:
    @router.get("/me")
    def read_me(current_user: User = Depends(get_current_user)):
        ...

    @router.delete("/transactions/{id}")
    def delete_txn(current_user: User = Depends(require_admin)):
        ...  # only ADMIN role reaches this point
"""
import uuid

from datetime import datetime, timezone

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.device_auth import verify_device_api_key
from app.core.security import decode_token
from app.models.device import Device
from app.models.user import User, UserRole

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise credentials_exception

    payload = decode_token(credentials.credentials)
    if payload is None or payload.token_type != "access":
        raise credentials_exception

    try:
        user_id = uuid.UUID(payload.user_id)
    except ValueError:
        raise credentials_exception

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise credentials_exception

    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires admin privileges",
        )
    return current_user


def get_current_device(
    x_device_key: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Device:
    """
    Authenticates the Android Accessibility Service's ingestion requests
    via the X-Device-Key header (see core/device_auth.py for why this
    isn't a JWT). We have to scan active devices and check each hash
    rather than looking up by key directly, since only the hash is
    stored — fine at the scale of "devices per user across the app",
    not a bottleneck for a capstone's expected load.
    """
    unauthorized = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing device key")

    if not x_device_key:
        raise unauthorized

    for device in db.query(Device).filter(Device.is_active.is_(True)).all():
        if verify_device_api_key(x_device_key, device.hashed_api_key):
            device.last_seen_at = datetime.now(timezone.utc)
            db.commit()
            return device

    raise unauthorized
