import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UploadStatus(str, enum.Enum):
    QUEUED = "queued"
    PARSING = "parsing"
    CATEGORIZING = "categorizing"
    COMPLETED = "completed"
    FAILED = "failed"


class StatementUpload(Base):
    """
    Tracks a single PDF statement upload as it moves through the pipeline:
    upload -> parse (pdfplumber) -> extract transactions -> AI categorize
    -> done. Parsing/categorization runs as a background task, so the
    frontend polls GET /uploads/{id} for status rather than blocking on
    a single long request.
    """
    __tablename__ = "statement_uploads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)

    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1000), nullable=False)

    status: Mapped[UploadStatus] = mapped_column(Enum(UploadStatus, name="upload_status"), default=UploadStatus.QUEUED, nullable=False)
    transactions_found: Mapped[int] = mapped_column(Integer, default=0)
    transactions_imported: Mapped[int] = mapped_column(Integer, default=0)
    transactions_skipped_duplicate: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    owner: Mapped["User"] = relationship(back_populates="statement_uploads")
