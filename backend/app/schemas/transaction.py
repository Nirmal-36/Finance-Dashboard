import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.transaction import CategorizationStatus, TransactionSource, TransactionType
from app.schemas.account import CategoryOut


class TransactionCreate(BaseModel):
    """Manual transaction entry (admin action)."""
    account_id: uuid.UUID
    category_id: uuid.UUID | None = None
    amount: Decimal = Field(gt=0)
    type: TransactionType
    txn_timestamp: datetime
    merchant_raw: str = Field(min_length=1, max_length=500)
    description: str | None = None


class TransactionUpdate(BaseModel):
    """Partial update — used for editing a transaction or re-categorizing it."""
    category_id: uuid.UUID | None = None
    merchant_normalized: str | None = Field(default=None, max_length=255)
    description: str | None = None
    amount: Decimal | None = Field(default=None, gt=0)


class TransactionOut(BaseModel):
    id: uuid.UUID
    account_id: uuid.UUID
    category: CategoryOut | None = None
    amount: Decimal
    type: TransactionType
    txn_timestamp: datetime
    merchant_raw: str
    merchant_normalized: str | None
    description: str | None
    reference_id: str | None
    source: TransactionSource
    categorization_status: CategorizationStatus
    ai_confidence: Decimal | None
    is_recurring: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedTransactions(BaseModel):
    items: list[TransactionOut]
    total: int
    page: int
    page_size: int
    total_pages: int
