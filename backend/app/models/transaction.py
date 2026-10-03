import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TransactionType(str, enum.Enum):
    DEBIT = "debit"
    CREDIT = "credit"


class TransactionSource(str, enum.Enum):
    """How this transaction entered the system — matters for dedup logic
    and for showing the user provenance ("captured live" vs "from PDF")."""
    PDF_UPLOAD = "pdf_upload"
    DEVICE_CAPTURE = "device_capture"   # Android Accessibility Service
    MANUAL = "manual"


class CategorizationStatus(str, enum.Enum):
    PENDING = "pending"       # queued for AI categorization
    AI_CATEGORIZED = "ai_categorized"
    USER_CONFIRMED = "user_confirmed"  # user accepted or overrode the AI's category
    FAILED = "failed"


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        # Prevents the same transaction being stored twice if it arrives via
        # both PDF upload and device capture (common for recent transactions).
        # dedup_hash is computed in services/dedup.py from
        # (user_id, amount, txn_timestamp, merchant_raw).
        UniqueConstraint("user_id", "dedup_hash", name="uq_transaction_dedup"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)

    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    type: Mapped[TransactionType] = mapped_column(Enum(TransactionType, name="transaction_type"), nullable=False)
    txn_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)

    merchant_raw: Mapped[str] = mapped_column(String(500), nullable=False)       # e.g. "Paid to SWIGGY INDIA PVT"
    merchant_normalized: Mapped[str | None] = mapped_column(String(255), nullable=True)  # AI-cleaned, e.g. "Swiggy"
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    reference_id: Mapped[str | None] = mapped_column(String(255), nullable=True)  # UPI ref / transaction ID from source

    source: Mapped[TransactionSource] = mapped_column(Enum(TransactionSource, name="transaction_source"), nullable=False)
    dedup_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)

    categorization_status: Mapped[CategorizationStatus] = mapped_column(
        Enum(CategorizationStatus, name="categorization_status"), default=CategorizationStatus.PENDING, nullable=False
    )
    ai_confidence: Mapped[float | None] = mapped_column(Numeric(4, 3), nullable=True)  # 0.000–1.000

    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)  # set by recurring-bill detection job

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner: Mapped["User"] = relationship(back_populates="transactions")
    account: Mapped["Account"] = relationship(back_populates="transactions")
    category: Mapped["Category | None"] = relationship(back_populates="transactions")
