import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.account import AccountSource


class AccountCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    source: AccountSource
    current_balance: Decimal = Decimal("0")


class AccountUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    current_balance: Decimal | None = None


class AccountOut(BaseModel):
    id: uuid.UUID
    name: str
    source: AccountSource
    current_balance: Decimal
    created_at: datetime

    model_config = {"from_attributes": True}


class CategoryOut(BaseModel):
    id: uuid.UUID
    name: str
    color: str
    is_system: bool

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    color: str = Field(default="#9ca3af", pattern=r"^#[0-9a-fA-F]{6}$")
