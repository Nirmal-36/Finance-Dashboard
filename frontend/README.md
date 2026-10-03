# Finance Dashboard UI

> Analyze spending, monitor balances, and manage transactions with a fast, interactive dashboard.

A frontend-only finance dashboard built with React and Vite. It includes summary KPIs, interactive charts, transaction search and filtering, role-based actions, recurring bill forecasting, budget tracking, and export support.

---

## Demo

Run locally:

```bash
npm install
npm run dev
```

---

## Features

| Area | Feature | Description |
|---|---|---|
| Overview | Summary Cards | Total balance, income, and expenses with trend comparison |
| Charts | Balance Trend | Monthly running balance line chart based on active filters |
| Charts | Spending Breakdown | Category-wise expense pie chart with click-to-filter behavior |
| Transactions | Advanced Filtering | Search by description/category, type filter, category filter, date range |
| Transactions | Sorting and Pagination | Sort by date/amount and browse data with page controls |
| Access Control | Role-Based UI | Viewer/Admin role switch; Admin can add, edit, and delete transactions |
| Planning | Budget vs Actual | Compare monthly category budgets with actual expenses |
| Planning | Upcoming Bills | 30-day recurring transaction forecast |
| Planning | Cashflow Heatmap | Daily expense intensity view for the active month |
| Export | Data Export | Download filtered transactions as CSV or JSON |
| UX | Persistent Preferences | Theme, filters, role, transactions, and budgets are persisted locally |

---

## Architecture

Single-page React application with centralized Zustand state. UI modules consume derived data from finance utility functions, keeping business logic out of presentational components.

```text
User Actions (filters, role switch, edits)
		 |
		 v
	   Zustand Store
   (transactions, filters, role, budgets, theme)
		 |
		 v
	 Finance Utilities
 (summary, trends, breakdown, insights,
  budget-vs-actual, recurring forecast, heatmap)
		 |
		 v
	   UI Components
  (cards, charts, table, planning modules)
		 |
		 v
	 Export + Persistence
     (CSV/JSON + localStorage)
```

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/your-github-username/finance-dashboard-ui
cd finance-dashboard-ui
npm install
```

### 2. Start development server

```bash
npm run dev
```

### 3. Run quality checks

```bash
npm run lint
npm run build
```

---

## Tech Stack

- React 19 + Vite
- JavaScript (ES modules)
- Tailwind CSS v4
- Recharts
- Zustand (with persistence)
- Radix UI primitives + custom UI components
- react-day-picker for date selection

---

## Project Structure

```text
finance-dashboard-ui/
|-- public/
|   `-- favicon.svg
|-- src/
|   |-- components/
|   |   |-- dashboard/
|   |   |-- transactions/
|   |   `-- ui/
|   |-- data/
|   |   `-- transactions.js
|   |-- lib/
|   |   |-- finance.js
|   |   `-- utils.js
|   |-- store/
|   |   `-- useFinanceStore.js
|   |-- App.jsx
|   |-- index.css
|   `-- main.jsx
|-- PRD_ Finance Dashboard UI.md
|-- components.json
|-- eslint.config.js
|-- jsconfig.json
|-- package.json
`-- vite.config.js
```

---

## Known Limitations

- The project is frontend-only and uses seeded/mock transactions.
- Data persistence is browser-local (localStorage), not server-backed.
- Multi-user workflows and backend authentication are not implemented.
- Forecasting is based on transactions marked as recurring; it is a heuristic, not a predictive model.

---

## License

MIT
