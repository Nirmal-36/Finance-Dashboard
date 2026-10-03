"""
Parses transaction history out of exported PhonePe PDF statements.

Confirmed against a real PhonePe statement (structure verified via a
masked diagnostic -- amounts/names redacted, only line shape inspected).
Each transaction renders as a column-aligned row that pdfplumber extracts
as ONE line of text, followed by 2-3 metadata lines underneath:

    Oct 01, 2026 Paid to SWIGGY INDIA PVT LTD DEBIT Rs450.50
    02:30 PM Transaction ID T2610011430123456789999999
    UTR No. 123456789012
    Paid by XXXXXX1234

The header row "Date Transaction Details Type Amount" appears once near
the top of page 1 and is skipped. Some entries use "Payment to X" instead
of "Paid to X" (seen on recurring/subscription-style charges) -- both are
matched. The date+merchant+type+amount are all on the first line; the
time and transaction ID are on the line below it; UTR and "Paid by" are
informational only and not currently captured.

This parser is line-pattern based rather than relying on PDF table
extraction, because PhonePe statements aren't laid out as real tables --
they're styled text blocks that happen to align into columns visually.
We use pdfplumber only to extract text (layout-aware), then regex over
the extracted lines.

If PhonePe changes their statement format again, this is the single
place to update -- the rest of the pipeline (dedup, categorization,
DB writes) is format-agnostic and works off the ParsedTransaction
objects this module produces.
"""
import re
from dataclasses import dataclass
from datetime import datetime

import pdfplumber


@dataclass
class ParsedTransaction:
    txn_timestamp: datetime
    merchant_raw: str
    amount: float
    type: str  # "debit" | "credit"
    reference_id: str | None = None


# Matches the combined date+merchant+type+amount line, e.g.:
#   "Oct 01, 2026 Paid to SWIGGY INDIA PVT LTD DEBIT Rs450.50"
#   "Sep 15, 2026 Payment to Google Cloud DEBIT Rs2"
#   "Sep 20, 2026 Received from JOHN DOE CREDIT Rs2,000.00"
# Amount is currency-symbol-optional (the Rupee glyph sometimes extracts
# as garbled text depending on the PDF's embedded font -- seen in earlier
# testing), and has no required decimal part (a bare "Rs2" is valid, as
# confirmed against a real 2-rupee transaction).
_TXN_LINE_RE = re.compile(
    r"^(?P<date>[A-Za-z]{3}\s+\d{1,2},?\s+\d{4})\s+"
    r"(?:Paid to|Payment to|Received from|Sent to)\s+"
    r"(?P<merchant>.+?)\s+"
    r"(?P<type>DEBIT|CREDIT)\s+"
    r"(?:\u20b9|Rs\.?|INR)?\s*(?P<amount>[\d,]+(?:\.\d{1,2})?)\s*$",
    re.IGNORECASE,
)

# Matches the time + transaction ID line that follows, e.g.:
#   "02:30 PM Transaction ID T2610011430123456789999999"
_TIME_REF_RE = re.compile(
    r"^(?P<hour>\d{1,2}):(?P<minute>\d{2})\s*(?P<meridiem>AM|PM)\s+"
    r"Transaction ID\s+(?P<ref>[A-Za-z0-9]+)",
    re.IGNORECASE,
)

# The header row printed once near the top -- not a transaction, skip it.
_HEADER_RE = re.compile(r"^Date\s+Transaction Details\s+Type\s+Amount\s*$", re.IGNORECASE)


def _parse_time(hour: str, minute: str, meridiem: str) -> tuple[int, int]:
    h, m = int(hour), int(minute)
    meridiem = meridiem.upper()
    if meridiem == "PM" and h != 12:
        h += 12
    if meridiem == "AM" and h == 12:
        h = 0
    return h, m


def parse_phonepe_statement(file_path: str) -> list[ParsedTransaction]:
    """
    Extracts all transactions from a PhonePe PDF statement.
    Raises ValueError if the file can't be parsed at all (not a PDF,
    corrupted, or unrecognized format) so the caller can mark the
    upload as FAILED with a clear message.
    """
    transactions: list[ParsedTransaction] = []

    try:
        with pdfplumber.open(file_path) as pdf:
            all_lines: list[str] = []
            for page in pdf.pages:
                text = page.extract_text() or ""
                all_lines.extend(line.strip() for line in text.split("\n") if line.strip())
    except Exception as e:
        raise ValueError(f"Could not read PDF: {e}")

    if not all_lines:
        raise ValueError("PDF appears to be empty or contains no extractable text (may be a scanned image)")

    i = 0
    while i < len(all_lines):
        line = all_lines[i]

        if _HEADER_RE.match(line):
            i += 1
            continue

        txn_match = _TXN_LINE_RE.match(line)
        if txn_match:
            try:
                txn_date = datetime.strptime(txn_match.group("date").replace(",", ""), "%b %d %Y")
            except ValueError:
                i += 1
                continue

            merchant = txn_match.group("merchant").strip()
            txn_type = txn_match.group("type").lower()
            amount = float(txn_match.group("amount").replace(",", ""))

            # Time + transaction ID is on the next line, if present.
            hour, minute, reference_id = 0, 0, None
            if i + 1 < len(all_lines):
                time_match = _TIME_REF_RE.match(all_lines[i + 1])
                if time_match:
                    hour, minute = _parse_time(time_match.group("hour"), time_match.group("minute"), time_match.group("meridiem"))
                    reference_id = time_match.group("ref")

            transactions.append(
                ParsedTransaction(
                    txn_timestamp=txn_date.replace(hour=hour, minute=minute),
                    merchant_raw=merchant,
                    amount=amount,
                    type=txn_type,
                    reference_id=reference_id,
                )
            )
            i += 1
            continue

        i += 1

    if not transactions:
        raise ValueError(
            "No transactions could be extracted from this PDF. "
            "The file may not be a PhonePe statement, or PhonePe may have changed their export format."
        )

    return transactions
