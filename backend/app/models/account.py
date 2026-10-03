import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AccountSource(str, enum.Enum):
    PHONEPE = "phonepe"
    GPAY = "gpay"
    PAYTM = "paytm"
    BANK = "bank"
    MANUAL = "manual"


class Account(Base):
    """
    A financial account a user tracks — e.g. their PhonePe wallet, a bank
    account, or a manually-added account. Transactions belong to an account.
    Most users will have one "virtual" account per payment app source,
    since PhonePe/GPay don't expose real account numbers via PDF or
    notification capture.
    """
    __tablename__ = "accounts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source: Mapped[AccountSource] = mapped_column(Enum(AccountSource, name="account_source"), nullable=False)
    current_balance: Mapped[float] = mapped_column(Numeric(14, 2), default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner: Mapped["User"] = relationship(back_populates="accounts")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="account", cascade="all, delete-orphan")
