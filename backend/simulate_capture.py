#!/usr/bin/env python3
"""
simulate_capture.py — stand-in for the not-yet-built Android Accessibility
Service module of FinanceLens. For demo/capstone purposes only.

It posts fake PhonePe/GPay-style transactions to POST /devices/ingest,
authenticated with a device API key in the X-Device-Key header, exactly
as the real Accessibility Service will. Request body (DeviceCaptureRequest):
    account_id, amount, type ("debit"|"credit"), txn_timestamp (ISO 8601),
    merchant_raw, reference_id

Authenticate with either:
  --pair-code CODE   a 6-digit pairing code generated in the app (valid for 3
                     minutes, single use); exchanged via POST /devices/pair
                     for the device's real API key
  --api-key KEY      a raw device API key you already have
Get an account id from GET /accounts.

Examples:
    ./simulate_capture.py --pair-code 123456 --account-id UUID --burst 60
    ./simulate_capture.py --api-key KEY --account-id UUID --burst 60
    ./simulate_capture.py --api-key KEY --account-id UUID --live
"""
import argparse
import os
import random
import sys
import time
from datetime import datetime, timedelta, timezone

import requests

# (name, weight, min_amt, max_amt, round_to) — debit merchants
DEBIT_MERCHANTS = [
    ("Swiggy", 14, 120, 850, 1),
    ("Zomato", 12, 120, 900, 1),
    ("Uber", 8, 80, 650, 1),
    ("Ola", 4, 70, 500, 1),
    ("Amazon", 8, 199, 6500, 1),
    ("Flipkart", 4, 249, 5500, 1),
    ("Blinkit", 7, 90, 1200, 1),
    ("BigBasket", 4, 300, 2500, 1),
    ("Sri Lakshmi Kirana Store", 8, 40, 700, 1),
    ("Ganesh General Stores", 5, 30, 500, 1),
    ("Fresh Vegetables & Fruits", 4, 50, 400, 1),
    ("Apollo Pharmacy", 3, 80, 1500, 1),
    ("Starbucks", 2, 180, 700, 1),
    ("Chai Point", 3, 20, 200, 1),
    ("Netflix", 1, 199, 649, 1),
    ("Spotify", 1, 119, 199, 1),
    ("Jio Prepaid Recharge", 2, 239, 799, 1),
    ("BESCOM Electricity Bill", 2, 600, 3200, 1),
    ("Airtel Broadband", 1, 699, 1499, 1),
    ("BookMyShow", 2, 250, 1400, 1),
    ("IRCTC", 2, 300, 3500, 1),
    ("Indian Oil Petrol Pump", 3, 300, 2500, 100),
]
RENT = ("Rent - Mr. Suresh Reddy", 12000, 18000)
FRIENDS = ["Rahul Sharma", "Priya Nair", "Arjun Mehta", "Sneha Iyer", "Karthik R", "Divya Menon", "Aman Verma"]
CREDIT_SOURCES = [
    ("Salary - Acme Technologies", 35000, 85000),
    ("Refund - Amazon", 150, 3000),
    ("Refund - Swiggy", 80, 500),
    ("Cashback - PhonePe", 5, 150),
    ("Interest Credit", 20, 400),
]


def ref_id() -> str:
    # UPI RRNs are 12 digits
    return "".join(random.choices("0123456789", k=12))


def make_txn(ts: datetime) -> dict:
    roll = random.random()
    if roll < 0.12:  # friend-to-friend UPI
        friend = random.choice(FRIENDS)
        if random.random() < 0.65:
            kind, merchant = "debit", f"UPI/{friend}"
        else:
            kind, merchant = "credit", f"UPI/{friend}"
        amount = random.choice([50, 100, 150, 200, 250, 300, 500, 750, 1000, 1500, 2000, 3000])
    elif roll < 0.18:  # credits (salary/refunds/cashback)
        name, lo, hi = random.choices(CREDIT_SOURCES, weights=[1, 4, 3, 5, 2])[0]
        kind, merchant, amount = "credit", name, round(random.uniform(lo, hi), 2)
    elif roll < 0.20:
        kind, merchant = "debit", RENT[0]
        amount = random.randrange(RENT[1], RENT[2] + 1, 500)
    else:
        name, _, lo, hi, step = random.choices(DEBIT_MERCHANTS, weights=[m[1] for m in DEBIT_MERCHANTS])[0]
        kind, merchant = "debit", name
        amount = round(random.uniform(lo, hi))
        if step > 1:
            amount = round(amount / step) * step
    return {
        "amount": f"{amount:.2f}" if isinstance(amount, float) else str(amount),
        "type": kind,
        "txn_timestamp": ts.isoformat(),
        "merchant_raw": merchant,
        "reference_id": ref_id(),
    }


def post(session, url, account_id, txn) -> str:
    body = {**txn, "account_id": account_id}
    sign = "-" if txn["type"] == "debit" else "+"
    line = f"{txn['txn_timestamp'][:16]}  {sign}₹{float(txn['amount']):>9,.2f}  {txn['merchant_raw']:<30} ref={txn['reference_id']}"
    try:
        r = session.post(url, json=body, timeout=15)
    except requests.RequestException as e:
        print(f"{line}\n   -> FAILED (network): {e}")
        return "error"
    if r.status_code == 200:
        data = r.json()
        if data.get("duplicate"):
            print(f"{line}\n   -> 200 DEDUPED (already stored, txn {data.get('transaction_id')}) — dedup working")
            return "duplicate"
        print(f"{line}\n   -> 200 captured (txn {data.get('transaction_id')})")
        return "ok"
    print(f"{line}\n   -> FAILED {r.status_code}: {r.text[:200]}")
    return "error"


def exchange_pair_code(base_url: str, code: str) -> str:
    """Trade a one-time pairing code for the device's API key."""
    url = base_url.rstrip("/") + "/devices/pair"
    try:
        r = requests.post(url, json={"code": code}, timeout=15)
    except requests.RequestException as e:
        sys.exit(f"Pairing failed (network): {e}")
    if r.status_code != 200:
        try:
            detail = r.json().get("detail", r.text[:200])
        except ValueError:
            detail = r.text[:200]
        sys.exit(f"Pairing failed ({r.status_code}): {detail}")
    data = r.json()
    print(f"Paired with device \"{data.get('device_name')}\" ({data.get('id')})")
    return data["api_key"]


def main():
    p = argparse.ArgumentParser(description="Simulate Android Accessibility Service captures against /devices/ingest.")
    p.add_argument("--pair-code", default=os.getenv("PAIR_CODE"), help="6-digit pairing code from the app, exchanged for the API key (env: PAIR_CODE)")
    p.add_argument("--api-key", default=os.getenv("DEVICE_API_KEY"), help="raw device API key, fallback if you have no pairing code (env: DEVICE_API_KEY)")
    p.add_argument("--account-id", default=os.getenv("ACCOUNT_ID"), help="account UUID to attach to (env: ACCOUNT_ID)")
    p.add_argument("--base-url", default=os.getenv("API_BASE_URL", "http://localhost:8000/api/v1"), help="backend base URL (env: API_BASE_URL)")
    mode = p.add_mutually_exclusive_group(required=True)
    mode.add_argument("--burst", type=int, metavar="N", help="post N historical transactions over the last ~90 days")
    mode.add_argument("--live", action="store_true", help="post one transaction every 10-30s until Ctrl+C")
    a = p.parse_args()

    if not a.account_id:
        p.error("--account-id is required (or set ACCOUNT_ID)")
    if not a.pair_code and not a.api_key:
        p.error("provide --pair-code (or PAIR_CODE), or --api-key (or DEVICE_API_KEY)")

    # An explicit --pair-code takes precedence over a key from the environment.
    api_key = exchange_pair_code(a.base_url, a.pair_code.strip()) if a.pair_code else a.api_key

    url = a.base_url.rstrip("/") + "/devices/ingest"
    session = requests.Session()
    session.headers["X-Device-Key"] = api_key
    counts = {"ok": 0, "duplicate": 0, "error": 0}

    try:
        if a.burst:
            now = datetime.now(timezone.utc)
            stamps = sorted(now - timedelta(seconds=random.randint(60, 90 * 86400)) for _ in range(a.burst))
            for ts in stamps:
                counts[post(session, url, a.account_id, make_txn(ts))] += 1
        else:
            print(f"Live capture -> {url}  (Ctrl+C to stop)")
            while True:
                counts[post(session, url, a.account_id, make_txn(datetime.now(timezone.utc)))] += 1
                time.sleep(random.uniform(10, 30))
    except KeyboardInterrupt:
        print("\nStopped.")
    print(f"Summary: {counts['ok']} captured, {counts['duplicate']} deduped, {counts['error']} failed")
    sys.exit(1 if counts["error"] and not counts["ok"] else 0)


if __name__ == "__main__":
    main()
