"""
Synthetic transaction generator for demos and manual testing.

Deliberately bypasses the PDF / device-capture pipelines: rows are inserted
straight through the session with categories assigned from merchant keywords
(no AI call, no dedup lookups beyond avoiding hash collisions with itself and
existing rows). Amounts are sized so the running balance stays positive —
salary credits comfortably exceed the generated monthly spend.
"""
import random
import uuid
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.transaction import CategorizationStatus, Transaction, TransactionSource, TransactionType
from app.services.dedup import compute_dedup_hash

IST = timezone(timedelta(hours=5, minutes=30))

DEBIT, CREDIT = TransactionType.DEBIT, TransactionType.CREDIT

# (merchant, category, weight, min_amt, max_amt, round_to) — everyday discretionary debits
EVERYDAY = [
    ("Swiggy", "Food & Dining", 14, 120, 850, 1),
    ("Zomato", "Food & Dining", 12, 120, 900, 1),
    ("Starbucks", "Food & Dining", 3, 180, 700, 1),
    ("Chai Point", "Food & Dining", 4, 20, 200, 1),
    ("Uber", "Transport", 9, 80, 650, 1),
    ("Ola", "Transport", 4, 70, 500, 1),
    ("Indian Oil Petrol Pump", "Transport", 3, 300, 2500, 100),
    ("Amazon", "Shopping", 8, 199, 6500, 1),
    ("Flipkart", "Shopping", 4, 249, 5500, 1),
    ("Blinkit", "Groceries", 7, 90, 1200, 1),
    ("BigBasket", "Groceries", 4, 300, 2500, 1),
    ("Sri Lakshmi Kirana Store", "Groceries", 8, 40, 700, 1),
    ("Ganesh General Stores", "Groceries", 5, 30, 500, 1),
    ("Fresh Vegetables & Fruits", "Groceries", 4, 50, 400, 1),
    ("Apollo Pharmacy", "Health & Fitness", 3, 80, 1500, 1),
    ("BookMyShow", "Entertainment", 2, 250, 1400, 1),
    ("IRCTC", "Transport", 2, 300, 3500, 1),
]
FRIENDS = ["Rahul Sharma", "Priya Nair", "Arjun Mehta", "Sneha Iyer", "Karthik R", "Divya Menon", "Aman Verma"]
TRANSFER_AMOUNTS = [50, 100, 150, 200, 250, 300, 500, 750, 1000, 1500, 2000, 3000]
CREDIT_SOURCES = [
    ("Refund - Amazon", "Shopping", 150, 3000),
    ("Refund - Swiggy", "Food & Dining", 80, 500),
    ("Cashback - PhonePe", "Income", 5, 150),
]
# (merchant, category, day_of_month, min_amt, max_amt, recurring)
MONTHLY_BILLS = [
    ("Rent - Mr. Suresh Reddy", "Rent & Housing", 3, 14000, 16000, True),
    ("BESCOM Electricity Bill", "Bills & Utilities", 10, 600, 3200, True),
    ("Airtel Broadband", "Bills & Utilities", 12, 999, 999, True),
    ("Jio Prepaid Recharge", "Bills & Utilities", 15, 299, 299, True),
    ("Netflix", "Entertainment", 18, 649, 649, True),
    ("Spotify", "Entertainment", 20, 119, 119, True),
]


def _ref_id() -> str:
    return "".join(random.choices("0123456789", k=12))


def _month_start(d: date, months_back: int) -> date:
    idx = d.year * 12 + (d.month - 1) - months_back
    return date(idx // 12, idx % 12 + 1, 1)


def _days_in_month(first: date) -> int:
    nxt = _month_start(first, -1)
    return (nxt - first).days


def generate_demo_transactions(
    db: Session, user_id: uuid.UUID, account_id: uuid.UUID, months: int, today: date | None = None
) -> int:
    """Inserts demo transactions across the last `months` calendar months
    (current month up to now) and returns how many were created."""
    now = datetime.now(IST)
    today = today or now.date()
    categories = {c.name: c.id for c in db.query(Category).filter(Category.user_id == user_id)}
    used_hashes: set[str] = {
        h for (h,) in db.query(Transaction.dedup_hash).filter(Transaction.user_id == user_id)
    }
    rows: list[Transaction] = []

    def add(day: date, merchant: str, category: str, kind: TransactionType, amount: float, recurring: bool = False):
        for _ in range(5):  # retry on the off chance of an identical minute/amount/merchant
            ts = datetime.combine(day, time(random.randint(8, 22), random.randint(0, 59)), tzinfo=IST)
            if ts > now:
                ts = now.replace(second=0, microsecond=0)
            h = compute_dedup_hash(user_id, amount, ts, merchant)
            if h not in used_hashes:
                used_hashes.add(h)
                rows.append(Transaction(
                    user_id=user_id,
                    account_id=account_id,
                    category_id=categories.get(category),
                    amount=amount,
                    type=kind,
                    txn_timestamp=ts,
                    merchant_raw=merchant,
                    merchant_normalized=merchant.split(" - ")[0].removeprefix("UPI/"),
                    reference_id=_ref_id(),
                    source=TransactionSource.MANUAL,
                    dedup_hash=h,
                    categorization_status=CategorizationStatus.USER_CONFIRMED,
                    is_recurring=recurring,
                ))
                return

    salary = random.randrange(60000, 75001, 500)
    weights = [m[2] for m in EVERYDAY]

    for back in range(months - 1, -1, -1):
        first = _month_start(today, back)
        last_day = min(_days_in_month(first), (today - first).days + 1) if back == 0 else _days_in_month(first)
        if last_day < 1:
            continue
        in_range = lambda dom: dom <= last_day  # noqa: E731  (don't post future-dated bills)

        if in_range(1):
            add(first, "Salary - Acme Technologies", "Income", CREDIT, float(salary))
        for merchant, cat, dom, lo, hi, recurring in MONTHLY_BILLS:
            if in_range(dom):
                amt = float(random.randrange(lo, hi + 1, 500 if hi - lo >= 1000 else 1)) if hi > lo else float(lo)
                add(first + timedelta(days=dom - 1), merchant, cat, DEBIT, amt, recurring)

        for dom in range(1, last_day + 1):
            day = first + timedelta(days=dom - 1)
            for _ in range(random.choices([0, 1, 2, 3], weights=[2, 5, 4, 1])[0]):
                name, cat, _w, lo, hi, step = random.choices(EVERYDAY, weights=weights)[0]
                amt = round(random.uniform(lo, hi))
                if step > 1:
                    amt = round(amt / step) * step
                add(day, name, cat, DEBIT, float(amt))
            if random.random() < 0.18:  # UPI transfers to/from friends, mostly outgoing
                friend = random.choice(FRIENDS)
                kind = DEBIT if random.random() < 0.65 else CREDIT
                add(day, f"UPI/{friend}", "Transfers", kind, float(random.choice(TRANSFER_AMOUNTS)))
            if random.random() < 0.05:
                name, cat, lo, hi = random.choice(CREDIT_SOURCES)
                add(day, name, cat, CREDIT, round(random.uniform(lo, hi), 2))

    db.add_all(rows)
    db.commit()
    return len(rows)
