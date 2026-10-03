from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.dashboard import (
    BalancePoint,
    BudgetVsActualItem,
    CategoryBreakdownItem,
    HeatmapDay,
    SummaryOut,
    UpcomingBillItem,
)
from app.services import analytics

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _default_period() -> tuple[date, date]:
    """Defaults to the current calendar month."""
    today = date.today()
    start = today.replace(day=1)
    return start, today


@router.get("/summary", response_model=SummaryOut)
def summary(
    period_start: date | None = Query(default=None),
    period_end: date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    default_start, default_end = _default_period()
    return analytics.get_summary(db, current_user.id, period_start or default_start, period_end or default_end)


@router.get("/balance-trend", response_model=list[BalancePoint])
def balance_trend(
    period_start: date | None = Query(default=None),
    period_end: date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    default_start, default_end = _default_period()
    return analytics.get_balance_trend(db, current_user.id, period_start or default_start, period_end or default_end)


@router.get("/category-breakdown", response_model=list[CategoryBreakdownItem])
def category_breakdown(
    period_start: date | None = Query(default=None),
    period_end: date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    default_start, default_end = _default_period()
    return analytics.get_category_breakdown(db, current_user.id, period_start or default_start, period_end or default_end)


@router.get("/budget-vs-actual", response_model=list[BudgetVsActualItem])
def budget_vs_actual(
    year: int = Query(default_factory=lambda: date.today().year),
    month: int = Query(default_factory=lambda: date.today().month, ge=1, le=12),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return analytics.get_budget_vs_actual(db, current_user.id, year, month)


@router.get("/upcoming-bills", response_model=list[UpcomingBillItem])
def upcoming_bills(
    days_ahead: int = Query(default=30, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return analytics.get_upcoming_bills(db, current_user.id, days_ahead)


@router.get("/heatmap", response_model=list[HeatmapDay])
def cashflow_heatmap(
    year: int = Query(default_factory=lambda: date.today().year),
    month: int = Query(default_factory=lambda: date.today().month, ge=1, le=12),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return analytics.get_cashflow_heatmap(db, current_user.id, year, month)
