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
```

### Database: Postgres via Docker

The easiest way to get Postgres running locally — no `createuser`/`createdb`
client tools needed, no system `postgres` user, works the same on macOS,
Linux, and WSL:

```bash
docker run --name financelens-db \
  -e POSTGRES_USER=financelens \
  -e POSTGRES_PASSWORD=financelens \
  -e POSTGRES_DB=financelens \
  -p 5432:5432 \
  -d postgres:16
```

Verify it's up: `docker ps` should show `financelens-db` as `Up`.

This matches the `DATABASE_URL` default already in `.env.example`:
```
DATABASE_URL=postgresql+psycopg2://financelens:financelens@localhost:5432/financelens
```
So if you use the command above as-is, you don't need to touch `DATABASE_URL`.

Managing the container day to day:
- Stop it: `docker stop financelens-db`
- Start it again later (data persists in the container): `docker start financelens-db`
- Wipe it completely and start fresh: `docker rm -f financelens-db`, then
  re-run the `docker run` command above

If port 5432 is already taken by something else on your machine, change the
host-side port (`-p 5433:5432`) and update `DATABASE_URL`'s port to match.

If you'd rather install Postgres natively instead of using Docker, that
works too — just make sure the user/database in `DATABASE_URL` actually
exist before running migrations.

### Run the migrations and start the server

```bash
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

## PDF parser status: verified against a real PhonePe statement

`services/pdf_parser.py` was originally built against a guessed layout and
tested only against a synthetic PDF — that version did NOT work against a
real export. It's since been rewritten against the real, confirmed
structure (verified via a masked diagnostic script, redacting amounts and
merchant names while preserving line shape) and now parses a real PhonePe
statement successfully.

**Known open issue: categorization quality.** Parsing and import work
correctly, but the categories Gemini assigns to real merchant names aren't
reliable yet — still to be improved. Likely directions worth trying later:
tightening the categorization prompt in `services/categorization.py`,
expanding/adjusting the category list in `models/category.py`, or adding
a few-shot examples of real (anonymized) merchant strings to the prompt.
Not blocking — transactions still import and can be recategorized manually
via `PATCH /transactions/{id}` — just not accurate enough yet to rely on
as-is.

If PhonePe changes their export format again in the future, or you need
to support GPay/Paytm/bank statements too, `diagnose_pdf.py` (a small
script that prints a PDF's line structure with amounts and merchant names
masked to `N`/`XXXX`) is the fastest way to see the new layout without
exposing real financial data — paste the masked output back for the
regexes in `pdf_parser.py` to be updated against it. Each source would get
its own `parse_<source>_statement()` function following the same
`ParsedTransaction` interface; the rest of the pipeline (dedup,
categorization, DB writes) doesn't change per source.

## Device-capture contract for the Android app

When you build the Accessibility Service companion app, here's the contract
it needs to follow:

1. **Once, interactively (user logged into the app):**
   `POST /api/v1/devices/register` with JWT auth, body `{"device_name": "..."}`
   → returns `{"id", "device_name", "api_key"}`. Store `api_key` in Android
   Keystore immediately.

   **Pairing codes (no copy-pasting keys):** `POST /api/v1/devices/{id}/pairing-code`
   (JWT) returns `{"code", "expires_at"}` — a single-use 6-digit code valid for
   3 minutes. An external tool exchanges it with the unauthenticated
   `POST /api/v1/devices/pair` (body `{"code": "123456"}`) for the same
   `{"id", "device_name", "api_key"}` shape. Invalid/expired/used codes return
   400; repeated failures from one IP return 429. Keys are stored encrypted
   (`DEVICE_KEY_ENCRYPTION_SECRET`) so they can be re-issued; devices registered
   before this feature have no stored copy and must be re-registered.
   `simulate_capture.py --pair-code 123456 --account-id <uuid> --burst 60`
   uses this flow (`--api-key` still works as a fallback).

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
PDF upload→parse→dedup→categorize pipeline (now confirmed against a real
PhonePe statement, not just synthetic data), device registration + capture
+ cross-source dedup against a PDF-sourced transaction, dashboard
summary/trend/breakdown, budgets + budget-vs-actual, upcoming-bills
detection, and the cashflow heatmap.

Not yet built: the actual Android Accessibility Service app. The React
frontend exists in a separate `financelens-frontend` repo.

## Role-based access

- `admin`: full read/write — create/edit/delete accounts, transactions,
  budgets, categories; upload statements; register/revoke devices.
- `viewer`: read-only on everything.

First signed-up user is auto-promoted to `admin`. To change someone's role
later, update the `role` column directly (a `PATCH /users/{id}/role`
admin-only endpoint would be a natural next addition if you want it exposed
via the API instead).
