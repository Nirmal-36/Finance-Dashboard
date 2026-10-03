# FinanceLens Frontend

React + TypeScript + Tailwind v4 frontend for FinanceLens, talking to the
FastAPI backend in `financelens-backend/`.

## Setup

```bash
npm install
cp .env.example .env
# edit .env if your backend runs somewhere other than localhost:8000

npm run dev
```

Visit `http://localhost:5173`. Make sure the backend (and its Postgres) is
running first — see the backend's own README.

## Stack

- **Vite + React + TypeScript**
- **Tailwind CSS v4** (CSS-first config — theme tokens live in `src/index.css`
  under `@theme`, not a `tailwind.config.js`)
- **React Router** — client-side routing, with a `ProtectedRoute` wrapper
  that redirects to `/login` when not authenticated
- **Zustand** — auth state (`src/store/authStore.ts`)
- **Axios** — API client with automatic access-token refresh on 401
  (`src/api/client.ts`) — concurrent 401s during a refresh are queued
  rather than each triggering their own refresh call
- **Recharts** — balance trend area chart, category breakdown pie chart
- **Lucide** — icons

## Structure

```
src/
  api/          one file per backend resource — auth, accounts, transactions,
                dashboard, uploads/devices — each just wraps the matching
                FastAPI routes
  components/
    ui/         generic primitives: Button, Input, Select, Card, Modal,
                Badge, EmptyState, Pagination, Spinner
    layout/     Sidebar, AppShell, ProtectedRoute
    dashboard/  summary cards, balance chart, category chart, upcoming
                bills, cashflow heatmap, first-run "create account" modal
    transactions/  filter bar, table row, create/edit modal
    budgets/    progress-bar card, create modal
    uploads/    drag-and-drop zone, status badge
    devices/    one-time API-key reveal modal
  pages/        one per route — Login, Signup, Dashboard, Transactions,
                Budgets, Uploads, Devices
  store/        authStore (Zustand)
  types/        TypeScript types mirroring the backend's Pydantic schemas
  lib/          formatting helpers (currency, dates, class-name merge)
```

## Design notes

Dark theme built around a warm near-black ink palette rather than pure
black, with Fraunces (serif) for display numbers/headings and Inter for
everything else. The accent is a muted sage-teal (`--color-signal`) used
for credits/positive values; spend uses a warm amber; coral is reserved
specifically for over-budget and negative-balance states, not used as a
general "alert" color. See `src/index.css` for the full token set under
the `@theme` block.

## Role-based UI

Every admin-only action (adding/editing/deleting transactions, accounts,
budgets, uploading statements, registering devices) checks
`user.role === 'admin'` from the auth store and conditionally renders —
matches the backend's `require_admin` dependency, which is the actual
enforcement point. The frontend check is for UX only; a viewer calling
a write endpoint directly still gets a 403 from the backend.

## First-run flow

A freshly signed-up user has no accounts yet, so most pages would be
empty/broken. The Dashboard page checks for this and shows an
"add your first account" prompt instead of empty charts — once an
account exists, the rest of the app (uploads, transactions, budgets)
becomes usable.

## What's not done

- No automated tests (unit or e2e) — out of scope for this pass, worth
  adding before relying on this for a real submission
- No loading skeletons — pages show a centered spinner while loading,
  which is fine for a capstone demo but a real product would want
  skeleton screens
- Account management (editing/deleting accounts, not just creating the
  first one) doesn't have its own page yet — `accountsApi.update` and
  `.remove` exist and work, just no UI calls them beyond creation
- Category management (creating custom categories beyond the 13 seeded
  defaults) has an API function (`categoriesApi.create`) but no UI
