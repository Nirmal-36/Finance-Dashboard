import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Device(Base):
    """
    Represents one installation of the Android companion app on a user's
    phone. The Accessibility Service running on that phone authenticates
    its ingestion calls with this device's API key (see core/device_auth.py)
    rather than a JWT — the phone isn't a logged-in browser session, it's a
    background service that needs a long-lived credential it can store
    securely in Android Keystore.

    A user can register multiple devices (e.g. switches phones); each gets
    its own key so one can be revoked without logging the user out
    everywhere else.
    """
    __tablename__ = "devices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    device_name: Mapped[str] = mapped_column(String(255), nullable=False)  # e.g. "Anas's Pixel 8"
    hashed_api_key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    # Fernet-encrypted copy of the plaintext key, kept so the pairing-code flow
    # can hand the same key to an external tool. NULL for devices registered
    # before pairing codes existed — those can't be paired.
    encrypted_api_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    owner: Mapped["User"] = relationship(back_populates="devices")


class DevicePairingCode(Base):
    """
    Short-lived, single-use 6-digit code that lets an external tool (e.g.
    the simulator script) exchange it for a device's API key via
    POST /devices/pair without the key being copy-pasted by hand.
    """
    __tablename__ = "device_pairing_codes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(6), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
