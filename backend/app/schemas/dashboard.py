import uuid
from datetime import date
from decimal import Decimal

from pydantic import BaseModel


class SummaryOut(BaseModel):
    total_balance: Decimal
    total_income: Decimal
    total_expenses: Decimal
    income_trend_pct: float | None  # vs previous period, None if no prior data
    expense_trend_pct: float | None
    period_start: date
    period_end: date


class BalancePoint(BaseModel):
    date: date
    running_balance: Decimal


class CategoryBreakdownItem(BaseModel):
    category_id: uuid.UUID | None
    category_name: str
    color: str
    total_amount: Decimal
    transaction_count: int
    percentage: float


class BudgetVsActualItem(BaseModel):
    category_id: uuid.UUID
    category_name: str
    color: str
    budget_amount: Decimal
    actual_amount: Decimal
    percentage_used: float
    is_over_budget: bool


class UpcomingBillItem(BaseModel):
    merchant_normalized: str
    predicted_amount: Decimal
    predicted_date: date
    category_name: str | None
    confidence: str  # "high" | "medium" | "low" based on how regular the pattern is


class HeatmapDay(BaseModel):
    date: date
    total_spent: Decimal
    transaction_count: int
