"""
Deduplication: the same real-world transaction can enter the system twice —
once via a PDF statement upload (which includes historical data) and once
via the Android Accessibility Service (which captures it live, right when
it happens). We never want both copies to count.

Strategy: compute a stable hash from fields that will be identical for the
same transaction no matter which path it came through:
  - user_id
  - amount
  - txn_timestamp rounded to the minute (PDF statements and notification
    timestamps can differ by a few seconds)
  - a normalized merchant string (lowercased, whitespace-collapsed)

This hash is stored in Transaction.dedup_hash and enforced via a unique
constraint on (user_id, dedup_hash) at the DB level — so even a race
between two concurrent imports can't create a duplicate; the second
insert simply fails the constraint and we catch it.
"""
import hashlib
import re
import uuid
from datetime import datetime


def _normalize_merchant(raw: str) -> str:
    cleaned = re.sub(r"\s+", " ", raw.strip().lower())
    return cleaned


def compute_dedup_hash(user_id: uuid.UUID, amount: float, txn_timestamp: datetime, merchant_raw: str) -> str:
    rounded_minute = txn_timestamp.replace(second=0, microsecond=0)
    normalized_merchant = _normalize_merchant(merchant_raw)

    # amount formatted to 2 decimal places as a string avoids float
    # representation differences (e.g. 100.0 vs 100.00) producing different hashes
    key = f"{user_id}|{amount:.2f}|{rounded_minute.isoformat()}|{normalized_merchant}"
    return hashlib.sha256(key.encode("utf-8")).hexdigest()
