import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.statement_upload import UploadStatus


class StatementUploadOut(BaseModel):
    id: uuid.UUID
    original_filename: str
    status: UploadStatus
    transactions_found: int
    transactions_imported: int
    transactions_skipped_duplicate: int
    error_message: str | None
    created_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}
