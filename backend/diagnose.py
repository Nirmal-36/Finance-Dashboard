"""
Run this against your real PhonePe PDF to see its text structure WITHOUT
exposing actual amounts, merchant names, or reference numbers to anyone.

Usage:
    python3 diagnose_pdf.py /path/to/your/statement.pdf

It prints each line from the PDF with sensitive parts masked:
  - digits are replaced with 'N' (so "₹450.50" becomes "₹NNN.NN" — you can
    still see the format/pattern, just not the real number)
  - anything that looks like a name/merchant (runs of letters after
    "Paid to" / "Received from") is replaced with "XXXX"
  - transaction IDs / UTR numbers are masked the same way as amounts

Paste the MASKED output back — that's enough for me to fix the regex
patterns without seeing any of your real financial data.
"""
import re
import sys

import pdfplumber

if len(sys.argv) != 2:
    print("Usage: python3 diagnose_pdf.py /path/to/statement.pdf")
    sys.exit(1)

path = sys.argv[1]


def mask_line(line: str) -> str:
    # Mask merchant/payee names after "Paid to" / "Received from" / "Sent to"
    line = re.sub(
        r"(Paid to|Received from|Sent to)\s+(.+?)(\s{2,}|$)",
        lambda m: f"{m.group(1)} XXXX{m.group(3)}",
        line,
        flags=re.IGNORECASE,
    )
    # Mask all digit runs (amounts, transaction IDs, UTR numbers, phone numbers)
    line = re.sub(r"\d", "N", line)
    return line


with pdfplumber.open(path) as pdf:
    print(f"Total pages: {len(pdf.pages)}\n")
    print("=" * 60)
    print("MASKED TEXT FROM PAGE 1 (first 40 lines):")
    print("=" * 60)

    text = pdf.pages[0].extract_text() or ""
    lines = [l for l in text.split("\n") if l.strip()]

    for i, line in enumerate(lines[:40]):
        print(f"{i:3} | {mask_line(line)}")

    if len(lines) > 40:
        print(f"\n... ({len(lines) - 40} more lines on this page)")
