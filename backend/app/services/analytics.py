"""
All dashboard/analytics calculations live here, kept separate from the
route handlers so the aggregation logic is independently testable and
routes stay thin (just auth + calling into this module).
"""
import uuid
from collections import defaultdict
from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction, TransactionType


def get_summary(db: Session, user_id: uuid.UUID, period_start: date, period_end: date) -> dict:
    start_dt = datetime.combine(period_start, datetime.min.time())
    end_dt = datetime.combine(period_end, datetime.max.time())

    period_length = (period_end - period_start).days + 1
    prev_end = period_start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=period_length - 1)
    prev_start_dt = datetime.combine(prev_start, datetime.min.time())
    prev_end_dt = datetime.combine(prev_end, datetime.max.time())

    def sums_for(start_dt, end_dt):
        rows = (
            db.query(Transaction.type, func.coalesce(func.sum(Transaction.amount), 0))
            .filter(Transaction.user_id == user_id, Transaction.txn_timestamp.between(start_dt, end_dt))
            .group_by(Transaction.type)
            .all()
        )
        result = {TransactionType.CREDIT: Decimal("0"), TransactionType.DEBIT: Decimal("0")}
        for txn_type, total in rows:
            result[txn_type] = Decimal(total)
        return result

    current = sums_for(start_dt, end_dt)
    previous = sums_for(prev_start_dt, prev_end_dt)

    income = current[TransactionType.CREDIT]
    expenses = current[TransactionType.DEBIT]
    prev_income = previous[TransactionType.CREDIT]
    prev_expenses = previous[TransactionType.DEBIT]

    def pct_change(curr: Decimal, prev: Decimal) -> float | None:
        if prev == 0:
            return None
        return float((curr - prev) / prev * 100)

    # Overall balance = all-time credits minus all-time debits, not just this period
    all_time = (
        db.query(Transaction.type, func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.user_id == user_id)
        .group_by(Transaction.type)
        .all()
    )
    all_time_map = {t: Decimal(v) for t, v in all_time}
    total_balance = all_time_map.get(TransactionType.CREDIT, Decimal("0")) - all_time_map.get(TransactionType.DEBIT, Decimal("0"))

    return {
        "total_balance": total_balance,
        "total_income": income,
        "total_expenses": expenses,
        "income_trend_pct": pct_change(income, prev_income),
        "expense_trend_pct": pct_change(expenses, prev_expenses),
        "period_start": period_start,
        "period_end": period_end,
    }


def get_balance_trend(db: Session, user_id: uuid.UUID, period_start: date, period_end: date) -> list[dict]:
    """Running balance per day across the period, based on ALL transactions up to each day (not just within the period)."""
    start_dt = datetime.combine(period_start, datetime.min.time())

    # Balance just before period_start
    opening = (
        db.query(
            func.coalesce(func.sum(Transaction.amount).filter(Transaction.type == TransactionType.CREDIT), 0)
            - func.coalesce(func.sum(Transaction.amount).filter(Transaction.type == TransactionType.DEBIT), 0)
        )
        .filter(Transaction.user_id == user_id, Transaction.txn_timestamp < start_dt)
        .scalar()
    ) or Decimal("0")

    end_dt = datetime.combine(period_end, datetime.max.time())
    txns = (
        db.query(Transaction.txn_timestamp, Transaction.type, Transaction.amount)
        .filter(Transaction.user_id == user_id, Transaction.txn_timestamp.between(start_dt, end_dt))
        .order_by(Transaction.txn_timestamp)
        .all()
    )

    daily_delta: dict[date, Decimal] = defaultdict(lambda: Decimal("0"))
    for ts, txn_type, amount in txns:
        delta = amount if txn_type == TransactionType.CREDIT else -amount
        daily_delta[ts.date()] += delta

    points = []
    running = Decimal(opening)
    current_day = period_start
    while current_day <= period_end:
        running += daily_delta.get(current_day, Decimal("0"))
        points.append({"date": current_day, "running_balance": running})
        current_day += timedelta(days=1)

    return points


def get_category_breakdown(db: Session, user_id: uuid.UUID, period_start: date, period_end: date) -> list[dict]:
    start_dt = datetime.combine(period_start, datetime.min.time())
    end_dt = datetime.combine(period_end, datetime.max.time())

    rows = (
        db.query(
            Category.id,
            Category.name,
            Category.color,
            func.sum(Transaction.amount),
            func.count(Transaction.id),
        )
        .join(Transaction, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.DEBIT,
            Transaction.txn_timestamp.between(start_dt, end_dt),
        )
        .group_by(Category.id, Category.name, Category.color)
        .order_by(func.sum(Transaction.amount).desc())
        .all()
    )

    total = sum((row[3] for row in rows), Decimal("0"))

    return [
        {
            "category_id": cat_id,
            "category_name": name,
            "color": color,
            "total_amount": amount,
            "transaction_count": count,
            "percentage": float(amount / total * 100) if total > 0 else 0.0,
        }
        for cat_id, name, color, amount, count in rows
    ]


def get_budget_vs_actual(db: Session, user_id: uuid.UUID, year: int, month: int) -> list[dict]:
    start = date(year, month, 1)
    end = date(year + 1, 1, 1) - timedelta(days=1) if month == 12 else date(year, month + 1, 1) - timedelta(days=1)
    start_dt = datetime.combine(start, datetime.min.time())
    end_dt = datetime.combine(end, datetime.max.time())

    budgets = db.query(Budget).filter(Budget.user_id == user_id, Budget.year == year, Budget.month == month).all()

    actuals = dict(
        db.query(Transaction.category_id, func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.DEBIT,
            Transaction.txn_timestamp.between(start_dt, end_dt),
        )
        .group_by(Transaction.category_id)
        .all()
    )

    results = []
    for budget in budgets:
        actual = Decimal(actuals.get(budget.category_id, 0))
        pct = float(actual / budget.limit_amount * 100) if budget.limit_amount > 0 else 0.0
        results.append(
            {
                "category_id": budget.category_id,
                "category_name": budget.category.name,
                "color": budget.category.color,
                "budget_amount": budget.limit_amount,
                "actual_amount": actual,
                "percentage_used": pct,
                "is_over_budget": actual > budget.limit_amount,
            }
        )
    return results


def get_upcoming_bills(db: Session, user_id: uuid.UUID, days_ahead: int = 30) -> list[dict]:
    """
    Detects recurring transactions by grouping historical debits by
    normalized merchant and looking for a consistent ~monthly cadence
    (interval between occurrences within a 25-35 day window, amount
    within 10% variance). Projects the next occurrence forward.

    This is a heuristic, not ML — fine for a capstone demo, and the
    is_recurring flag it sets can later be upgraded to a proper
    time-series model without changing the API contract.
    """
    cutoff = datetime.now() - timedelta(days=200)  # look back far enough to catch a few cycles
    txns = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.DEBIT,
            Transaction.txn_timestamp >= cutoff,
            Transaction.merchant_normalized.isnot(None),
        )
        .order_by(Transaction.merchant_normalized, Transaction.txn_timestamp)
        .all()
    )

    by_merchant: dict[str, list[Transaction]] = defaultdict(list)
    for t in txns:
        by_merchant[t.merchant_normalized].append(t)

    bills = []
    today = date.today()

    for merchant, group in by_merchant.items():
        if len(group) < 2:
            continue

        intervals = [
            (group[i].txn_timestamp.date() - group[i - 1].txn_timestamp.date()).days for i in range(1, len(group))
        ]
        avg_interval = sum(intervals) / len(intervals)

        if not (25 <= avg_interval <= 35):
            continue  # not monthly-ish

        amounts = [float(t.amount) for t in group]
        avg_amount = sum(amounts) / len(amounts)
        variance_ok = all(abs(a - avg_amount) / avg_amount <= 0.10 for a in amounts) if avg_amount else False

        last_txn = group[-1]
        predicted_date = last_txn.txn_timestamp.date() + timedelta(days=round(avg_interval))

        if predicted_date < today or predicted_date > today + timedelta(days=days_ahead):
            continue

        confidence = "high" if (variance_ok and len(group) >= 3) else "medium" if variance_ok else "low"

        bills.append(
            {
                "merchant_normalized": merchant,
                "predicted_amount": Decimal(str(round(avg_amount, 2))),
                "predicted_date": predicted_date,
                "category_name": last_txn.category.name if last_txn.category else None,
                "confidence": confidence,
            }
        )

    return sorted(bills, key=lambda b: b["predicted_date"])


def get_cashflow_heatmap(db: Session, user_id: uuid.UUID, year: int, month: int) -> list[dict]:
    start = date(year, month, 1)
    end = date(year + 1, 1, 1) - timedelta(days=1) if month == 12 else date(year, month + 1, 1) - timedelta(days=1)
    start_dt = datetime.combine(start, datetime.min.time())
    end_dt = datetime.combine(end, datetime.max.time())

    rows = (
        db.query(
            func.date(Transaction.txn_timestamp),
            func.sum(Transaction.amount),
            func.count(Transaction.id),
        )
        .filter(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.DEBIT,
            Transaction.txn_timestamp.between(start_dt, end_dt),
        )
        .group_by(func.date(Transaction.txn_timestamp))
        .all()
    )
    by_date = {d: (amt, cnt) for d, amt, cnt in rows}

    days = []
    current = start
    while current <= end:
        amt, cnt = by_date.get(current, (Decimal("0"), 0))
        days.append({"date": current, "total_spent": Decimal(amt), "transaction_count": cnt})
        current += timedelta(days=1)

    return days
