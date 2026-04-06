# Finance Dashboard UI

Frontend-only finance dashboard built from the PRD using React, JavaScript, Tailwind CSS, shadcn-style UI components, Recharts, and Zustand.

## Stack

- React + Vite
- Tailwind CSS v4
- Zustand (with localStorage persistence)
- Recharts
- shadcn-style component primitives

## Run

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run build
```

## PRD Phase-wise Delivery

### Phase 1: Setup & Scaffolding

- Vite React app scaffolded
- Tailwind + alias configuration completed
- Folder structure created: `components/`, `store/`, `data/`, `lib/`
- Seed data (25 transactions over 3 months and multiple categories)

### Phase 2: Dashboard Overview

- Summary cards: balance, income, expenses
- Line chart: balance trend over time
- Donut chart: expense category breakdown
- Empty-state handling for chart data

### Phase 3: Transactions Section

- Transaction table with date/amount/category/type
- Search by description
- Filter by type and category
- Sorting by date and amount
- Empty-state UI for no matches

### Phase 4: Role-Based UI + Insights

- Role switcher (Viewer/Admin)
- Admin-only controls: add, edit, delete transactions
- Insights cards:
	- Highest spending category
	- Month-over-month comparison
	- Average transaction and monthly activity

### Phase 5: Optional Enhancements

- Dark mode toggle
- localStorage persistence for role/theme/filters/transactions
- Export filtered transactions as CSV and JSON

## Notes

- This project is intentionally frontend-only and uses mock data.
- Charts and insights are computed from currently filtered transactions.
