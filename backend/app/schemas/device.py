import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.transaction import TransactionType


class DeviceRegisterRequest(BaseModel):
    device_name: str = Field(min_length=1, max_length=255)


class DeviceRegisterResponse(BaseModel):
    """api_key is returned ONLY on registration — never retrievable again."""
    id: uuid.UUID
    device_name: str
    api_key: str


class DeviceOut(BaseModel):
    id: uuid.UUID
    device_name: str
    is_active: bool
    created_at: datetime
    last_seen_at: datetime | None

    model_config = {"from_attributes": True}


class DeviceCaptureRequest(BaseModel):
    """
    One captured transaction, as read off a notification/screen by the
    Accessibility Service. account_id tells us which of the user's
    accounts (PhonePe, GPay, etc) this came from — the companion app
    should be configured with the account id(s) it's watching.
    """
    account_id: uuid.UUID
    amount: Decimal = Field(gt=0)
    type: TransactionType
    txn_timestamp: datetime
    merchant_raw: str = Field(min_length=1, max_length=500)
    reference_id: str | None = Field(default=None, max_length=255)


class DeviceCaptureResponse(BaseModel):
    accepted: bool
    duplicate: bool
    transaction_id: uuid.UUID | None = None
