# FinanceLens Backend

FastAPI backend for FinanceLens — an AI-powered personal finance tracker that
ingests transactions from two sources (PhonePe PDF statements and a planned
Android Accessibility Service companion app) into one unified, deduplicated,
AI-categorized transaction store.

## Stack

- **FastAPI** — API framework
- **PostgreSQL + SQLAlchemy 2.0 + Alembic** — database and migrations
- **JWT (python-jose) + bcrypt** — auth (access + refresh token rotation)
- **pdfplumber** — PhonePe PDF statement parsing
- **Google Gemini** — merchant categorization and name normalization

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: set DATABASE_URL, JWT_SECRET_KEY (generate with the command
# in the comment above it in .env.example), and GEMINI_API_KEY

# Make sure Postgres is running and the DB/user in DATABASE_URL exist, e.g.:
#   createuser financelens -P
#   createdb financelens -O financelens

alembic upgrade head
uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` for interactive Swagger UI once running.

## Project structure

```
app/
  core/           # config, db session, JWT + password hashing, device-key auth, auth dependencies
  models/         # SQLAlchemy ORM models (one file per table)
  schemas/        # Pydantic request/response schemas
  services/       # business logic: PDF parsing, Gemini categorization, dedup, analytics, upload pipeline
  api/routes/     # route handlers (thin — call into services/)
  main.py         # app entrypoint, router registration
alembic/          # migrations
```

## How the pieces fit together

**Auth.** Signup/login issue a short-lived access token (30 min) and a
longer-lived refresh token (7 days) stored hashed in `refresh_tokens` so it
can be revoked. The first user to sign up becomes `admin`; everyone else
starts as `viewer`. Only `admin` can write (create/edit/delete accounts,
transactions, budgets, upload statements); `viewer` is read-only — matches
the role-based UI split in the original frontend spec.

**Two ingestion paths, one pipeline.** PDF upload and the Android
Accessibility Service both end up calling the same dedup + categorization
logic, so a transaction that shows up in both (e.g. captured live, then
later also present in a monthly PDF export) is only ever stored once. This
is enforced at the DB level with a unique constraint on
`(user_id, dedup_hash)` — not just application logic — so even a race
between two concurrent imports can't double-insert.

`dedup_hash` is computed from `(user_id, amount, txn_timestamp rounded to
the minute, normalized merchant string)`. See `services/dedup.py`.

**PDF pipeline** (`services/pdf_parser.py` + `services/upload_pipeline.py`):
upload → background task → pdfplumber text extraction → regex parsing into
`ParsedTransaction` objects → dedup check → Gemini batch categorization →
DB write. Status is pollable via `GET /uploads/{id}` since parsing+AI calls
happen in the background, not inline with the upload request.

**Device capture** (`core/device_auth.py` + `api/routes/devices.py`): the
Android app is not a logged-in browser session, so it doesn't use JWTs.
Instead, the user registers a device once (while logged in normally) and
gets a long-lived API key back — shown exactly once, meant to be stored in
Android Keystore. Every ingestion call from the Accessibility Service
authenticates via an `X-Device-Key` header instead.

**AI categorization** (`services/categorization.py`): a single Gemini call
per PDF batch (cheap) or per live capture (one at a time, since there's
nothing to batch). On any failure — no API key configured, API error,
malformed response — it falls back to `category="Other", confidence=0`
rather than raising, so a missing/broken Gemini key never blocks an import;
transactions just sit uncategorized until the user fixes it or categorizes
manually.

## ⚠️ Known limitation: PDF parser is unverified against a real statement

`services/pdf_parser.py` was built against my best understanding of
PhonePe's exported-statement text layout and tested only against a
**synthetic PDF I generated** to match that expected format — not a real
PhonePe export. Real statements will very likely differ in spacing,
exact wording, or how the ₹ symbol is encoded (my test PDF actually hit
this: Helvetica doesn't have a ₹ glyph, so the amount regex had to be
made currency-symbol-optional to be robust either way).

**Before relying on this for your actual demo/data**: export a real
PhonePe statement PDF, run it through `parse_phonepe_statement()`
directly (see the inline test pattern used during development — load the
PDF, print `pdf.pages[0].extract_text()` to see the raw text pdfplumber
extracts, compare against what the regexes in `pdf_parser.py` expect) and
adjust the regexes to match. The architecture around it (dedup,
categorization, DB writes) doesn't need to change — only the parsing
regexes are PhonePe-format-specific.

## Device-capture contract for the Android app

When you build the Accessibility Service companion app, here's the contract
it needs to follow:

1. **Once, interactively (user logged into the app):**
   `POST /api/v1/devices/register` with JWT auth, body `{"device_name": "..."}`
   → returns `{"id", "device_name", "api_key"}`. Store `api_key` in Android
   Keystore immediately — it's never retrievable again.

2. **On every captured transaction (background, no user interaction):**
   `POST /api/v1/devices/ingest` with header `X-Device-Key: <stored key>`,
   body matching `DeviceCaptureRequest` in `schemas/device.py`:
   ```json
   {
     "account_id": "<uuid of the PhonePe/GPay account this came from>",
     "amount": 450.50,
     "type": "debit",
     "txn_timestamp": "2026-10-01T14:30:00Z",
     "merchant_raw": "Paid to SWIGGY INDIA PVT LTD",
     "reference_id": "optional UPI ref"
   }
   ```
   Response tells you whether it was a genuine new transaction or a
   duplicate of something already in the system (e.g. from a PDF import):
   `{"accepted": true, "duplicate": false, "transaction_id": "..."}`

## What's tested vs. not

Verified end-to-end with real HTTP requests against a live Postgres
instance during development: full auth flow, accounts, categories,
transactions (CRUD + filters/search/sort/pagination + export), the full
PDF upload→parse→dedup→categorize pipeline (against the synthetic PDF
caveat above), device registration + capture + cross-source dedup against
a PDF-sourced transaction, dashboard summary/trend/breakdown, budgets +
budget-vs-actual, upcoming-bills detection, and the cashflow heatmap.

Not yet built: the actual Android Accessibility Service app, and the React
frontend. This repo is backend-only.

## Role-based access

- `admin`: full read/write — create/edit/delete accounts, transactions,
  budgets, categories; upload statements; register/revoke devices.
- `viewer`: read-only on everything.

First signed-up user is auto-promoted to `admin`. To change someone's role
later, update the `role` column directly (a `PATCH /users/{id}/role`
admin-only endpoint would be a natural next addition if you want it exposed
via the API instead).
