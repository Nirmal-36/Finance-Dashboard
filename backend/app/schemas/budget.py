import uuid
from decimal import Decimal

from pydantic import BaseModel, Field


class BudgetCreate(BaseModel):
    category_id: uuid.UUID
    year: int = Field(ge=2000, le=2100)
    month: int = Field(ge=1, le=12)
    limit_amount: Decimal = Field(gt=0)


class BudgetUpdate(BaseModel):
    limit_amount: Decimal = Field(gt=0)


class BudgetOut(BaseModel):
    id: uuid.UUID
    category_id: uuid.UUID
    year: int
    month: int
    limit_amount: Decimal

    model_config = {"from_attributes": True}
