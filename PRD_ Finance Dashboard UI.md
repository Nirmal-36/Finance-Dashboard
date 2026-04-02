# PRD: Finance Dashboard UI

### TL;DR

A frontend-only finance dashboard built with React, JavaScript, Tailwind CSS, shadcn/ui, Recharts, and Zustand. The app enables users to track financial activity through clear balance summaries, transaction tables, spending insights, and a simulated role-based UI (Viewer vs Admin). This is intended as a frontend evaluation assignment — not production-ready, but focused on clean, interactive, and well-structured design.

---

## Goals

### Business Goals

* Demonstrate proficiency with modern frontend frameworks, modular UI design, and responsive layouts.
* Showcase component architecture, state management, and data flow using industry-standard tools (React, Tailwind CSS, shadcn/ui, Zustand).
* Provide a codebase and UI/UX that clearly fulfill all core and optional requirements for evaluation.
* Highlight ability to create accessible, usable, and visually appealing interfaces.

### User Goals

* View high-level financial summaries (balance, income, expenses) at a glance.
* Explore detailed transaction history through filtering, sorting, and searching.
* Understand spending patterns and gain actionable insights (e.g., top categories, month-over-month trends).
* Switch between roles (Viewer/Admin) and see UI update accordingly for the right controls/features.

### Non-Goals

* No real backend, server APIs, or authentication — all logic is frontend simulated.
* No integration with third-party financial data providers.
* No need for production-grade data persistence beyond simple local storage.

---

## User Stories

**Persona 1: Viewer (read-only access)**

* As a Viewer, I want to log in and immediately see summary cards showing my total balance, income, and expenses so that I can quickly assess my financial standing.
* As a Viewer, I want to browse, filter, and search past transactions so that I can find specific expenses or income entries.
* As a Viewer, I want to view charts and insights to better understand my spending trends and habits.

**Persona 2: Admin (can add/edit transactions)**

* As an Admin, I want to use a dropdown to switch between Viewer and Admin roles so that I can demo and test different UI states.
* As an Admin, I want the ability to add new transactions directly from the dashboard so that I can quickly log new financial events.
* As an Admin, I want to edit existing transactions so that I can correct errors or update records.

---

## Functional Requirements

* **Dashboard Overview (Priority: P0)**

  * **Summary Cards:** Display cards for Total Balance, Income, and Expenses, reflecting current state.
  * **Line Chart (Balance Trend):** Show a time-based trend using Recharts to visualize how total balance changes month over month.
  * **Pie/Donut Chart (Spending Breakdown):** Categorical visualization of expenses by category (e.g., groceries, rent, utilities).

* **Transactions Section (Priority: P0)**

  * **Transaction Table:** List of transactions showing date, amount, category, and type (income or expense).
  * **Filtering:** Filter transactions by type and/or category.
  * **Search:** Text search by description.
  * **Sorting:** Sort transactions by date and amount.

* **Role-Based UI (Priority: P1)**

  * **Role Switcher Dropdown:** Allow user to switch between Viewer and Admin roles via a dropdown in the main navigation.
  * **Conditional UI:** Show/hide controls based on role—Viewer sees only read-only data; Admin sees add/edit/delete transaction controls.

* **Insights Section (Priority: P1)**

  * **Highest Spending Category:** Calculate and display the category with the most expenses.
  * **Month-over-Month Comparison:** Compare current and previous month spending.
  * **Additional Observation:** Display another insight (e.g., average transaction amount).

* **State Management (Priority: P0)**

  * **Zustand Store:** Maintain global state for:
    * Transaction data (seeded mock data: 20-30 items across categories and months)
    * Active filters and search queries
    * Selected UI role

* **Optional Enhancements (Priority: P2)**

  * **Dark Mode:** Toggle for light/dark appearance, especially with shadcn’s theme support.
  * **Local Storage Persistence:** Persist transactions and user settings in local storage.
  * **Export Functionality:** Allow user to export transactions to CSV or JSON for offline use.

---

## User Experience

**Entry Point & First-Time User Experience**

* User lands directly on the dashboard overview (e.g., `/dashboard`).
* Minimal onboarding; sample data and summary cards are shown immediately (no login/welcome modal required).
* A dismissible banner or tooltip may point out the “Role Switcher” dropdown for first-time users.

**Core Experience**

* **Step 1:** See responsive summary cards for Total Balance, Income, Expenses at top.
  * Cards use shadcn/ui for consistency and polish.
  * Colors differentiate card types (e.g., income green, expense red).
* **Step 2:** Review data visualizations (line chart for balance, pie/donut for category breakdown).
  * Charts show up-to-date data reflecting any filter/search state.
  * Gracefully handle empty data sets (e.g., "No data to display").
* **Step 3:** Navigate to Transactions section (or see in main view on mobile).
  * Table supports filtering by type/category, searching by description, and sorting by columns.
  * Color-coding for income (green) and expense (red) in amount cells.
  * Empty-state designs shown if no transactions match filters.
* **Step 4:** Use the role switcher in top nav to toggle between Viewer/Admin.
  * Interface instantly updates: admin-only controls (Add/Edit/Delete) appear/disappear.
* **Step 5:** As Admin, trigger “Add Transaction” modal/form; validate and submit data.
* **Step 6:** As Admin, edit an existing transaction from the table.
* **Step 7:** Scroll to Insights section showing:
  * Top spending category (with icon or highlight)
  * Month-over-month expense/income comparison (simple delta display)
  * Additional computed insight (e.g., average transaction, number of transactions this month)
* **Step 8 (Optional):** Toggle dark mode and/or export data if implemented.

**Advanced Features & Edge Cases**

* If transactions array is empty, show motivational or instructional empty state (e.g., “No transactions found. Add your first entry!”).
* If a chart has no data (due to filters or emptiness), display a clear “No Data Available” message in place of chart.
* Handle unsaved changes, validation errors, or failed local storage gracefully.

**UI/UX Highlights**

* Responsive card/grid layout: grid on desktop, single-column stacking for mobile.
* High color contrast and accessible controls (keyboard navigable, clear focus states).
* Consistent usage of shadcn/ui cards, buttons, modals, tables, and dropdowns.
* Color-coded transaction types: green (income), red (expense) with icons for quick parsing.
* Smooth in-app transitions and feedback (loading/fade in/out, field validation errors).

---

## Narrative

Anna, a young professional, wants to get a better handle on her monthly spending. She navigates to the finance dashboard and instantly sees her up-to-date total balance, alongside clearly laid-out summary cards highlighting her income and expenses for the month. The line chart below shows her balance trending upward, and a donut chart reveals that her highest category of spending last month was dining out.

Curious about her spending patterns, Anna switches to the transactions view, where she can filter by category and search for specific purchases — helping her quickly audit her expenses. She notices the “Role Switcher” dropdown in the nav bar and toggles to the Admin role. Instantly, the dashboard reveals new controls, so she easily adds a recently forgotten expense.

Anna then checks the insights section where she sees that she spent less than last month on entertainment and that her grocery costs are consistently her largest outlay. Satisfied with her understanding, she exports the data to CSV for her records.

With this simple, interactive dashboard, Anna has everything she needs at a glance — no confusion, no clutter. The project highlights clean frontend architecture and thoughtful UI decisions, meeting both Anna's needs as a user and the assignment's requirements for evaluation.

---

## Success Metrics

### User-Centric Metrics

* All summary cards, tables, and charts render and update according to real user actions (verified through manual testing).
* Users (evaluators) can successfully perform and observe all required interactions, including role switching and data filtering.
* All controls provide clear feedback and error handling, even in edge cases.

### Business Metrics

* Meets all 8 of the assignment’s evaluation criteria: design, responsiveness, functionality, UX, technical quality, state management, documentation, attention to detail.
* Positive reviewer feedback on UI/UX execution, code cleanliness, and compliance with specification.

### Technical Metrics

* Zero uncaught JavaScript errors or warnings in the console.
* Renders correctly on desktop, tablet, and mobile devices (verified via Chrome DevTools Device Mode or similar).
* Zustand store correctly encapsulates global state for transactions, filters, and role; no state leaks or persistence bugs.

### Tracking Plan

* (Not applicable for the scope of this assignment, but if implemented):
  * User toggles role (Viewer/Admin)
  * Transaction added/edited/deleted
  * Filters and searches performed
  * Export actions triggered
  * Dark mode toggled

---

## Technical Considerations

### Technical Needs

* Component-based React architecture with clear separation: `pages/`, `components/`, `store/`, `data/`.
* Zustand store managing app-wide state (transactions, filters, active role).
* Recharts for charts within dashboard.
* shadcn/ui for cards, tables, dropdown, modal, button components.
* Use of Tailwind utility classes for layout, spacing, color, and responsive design.
* Mock data file (e.g., `/data/transactions.js`) with 20–30 transactions, spanning at least 3 months and 5 categories.

### Integration Points

* No external systems or real APIs required.
* All data is simulated; optional use of localStorage for persistence.

### Data Storage & Privacy

* All data resides in browser memory via Zustand, optionally synced to localStorage if implemented.
* No external calls, PII, or privacy concerns, as it's strictly sandboxed and for evaluation/demo.

### Scalability & Performance

* Zustand store structured in slices, paving way for easy extension (e.g., additional dashboard features or data domains).
* Responsive layouts and virtualized lists if transaction volume grows.
* Charts compute values dynamically based on active filters/selections.

### Potential Challenges

* Simulating RBAC in UI without backend — avoids overcomplication by simply using a dropdown and conditional rendering.
* Ensuring charts and insights adjust in realtime to filter/search state, and handling empty/null data elegantly.
* Keeping codebase modular and clear for evaluator review.

---

## Milestones & Sequencing

### Project Estimate

* **Small:** 1–2 weeks

### Team Size & Composition

* **Extra-small Team:** 1 person (solo developer) doing design, implementation, and testing.

### Suggested Phases

**Phase 1: Setup & Scaffolding (Days 1–2)**

* Install React, Tailwind CSS, shadcn/ui, Zustand, Recharts.
* Scaffold initial directory and file structure.
* Create mock transaction data file.
* Set up Zustand store for state management.
* *Dependencies:* None.

**Phase 2: Dashboard Overview (Days 3–5)**

* Implement summary cards and overall dashboard layout.
* Integrate Recharts for balance trend and spending breakdown.
* Style components using Tailwind + shadcn/ui.
* *Dependencies:* Phase 1 complete.

**Phase 3: Transactions Section (Days 6–8)**

* Build transactions list/table with sorting, searching, and filtering.
* Ensure color coding and accessibility.
* Handle empty/edge cases.

**Phase 4: Role-Based UI & Insights (Days 9–10)**

* Implement role switcher dropdown; conditionally render admin features.
* Add forms/modals for adding/editing transactions.
* Calculate and display insights section.
* Test all UI role interactions.
* Document features and project approach in README.

**Optional Phase 5: Enhancements (if time allows)**

* Implement dark mode toggle.
* Add localStorage persistence for transactions/settings.
* Add export to CSV/JSON functionality.

---