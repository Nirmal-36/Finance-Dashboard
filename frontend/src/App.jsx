import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { MoonStar, Plus, Sun, WalletCards, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RoleSwitcher } from '@/components/role-switcher'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { InsightsPanel } from '@/components/dashboard/insights-panel'
import { TransactionTable } from '@/components/transactions/transaction-table'
import { AddEditTransactionDialog } from '@/components/add-edit-transaction-dialog'
import { ExportActions } from '@/components/export-actions'
import {
  getCategories,
  filterAndSortTransactions,
  getSummaryStats,
  getKpiTrends,
  getMonthlyBalanceTrend,
  getCategoryBreakdown,
  getInsights,
} from '@/lib/finance'
import { useFinanceStore } from '@/store/useFinanceStore'

const lazyNamed = (loader, exportName) => lazy(() => loader().then((module) => ({ default: module[exportName] })))

const BalanceTrendChart = lazyNamed(() => import('@/components/dashboard/balance-trend-chart'), 'BalanceTrendChart')
const SpendingBreakdownChart = lazyNamed(
  () => import('@/components/dashboard/spending-breakdown-chart'),
  'SpendingBreakdownChart',
)
const BudgetVsActual = lazyNamed(() => import('@/components/dashboard/budget-vs-actual'), 'BudgetVsActual')
const RecurringForecast = lazyNamed(() => import('@/components/dashboard/recurring-forecast'), 'RecurringForecast')
const CashflowHeatmap = lazyNamed(() => import('@/components/dashboard/cashflow-heatmap'), 'CashflowHeatmap')
const TransactionFilters = lazyNamed(() => import('@/components/transactions/transaction-filters'), 'TransactionFilters')

function SectionFallback({ label }) {
  return (
    <Card className="bg-white/75 backdrop-blur dark:bg-[hsl(var(--card))]">
      <CardContent className="py-10 text-center text-sm text-[hsl(var(--muted-foreground))]">Loading {label}...</CardContent>
    </Card>
  )
}

function App() {
  const pageSize = 8

  const {
    role,
    setRole,
    filters,
    setFilters,
    resetFilters,
    budgets,
    setCategoryBudget,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    theme,
    toggleTheme,
  } = useFinanceStore()

  const [dialogState, setDialogState] = useState({ open: false, mode: 'add', transaction: null })
  const [currentPage, setCurrentPage] = useState(1)

  const categories = useMemo(() => getCategories(transactions), [transactions])
  const visibleTransactions = useMemo(() => filterAndSortTransactions(transactions, filters), [transactions, filters])
  const totalPages = Math.max(1, Math.ceil(visibleTransactions.length / pageSize))
  const effectivePage = Math.min(currentPage, totalPages)

  const paginatedTransactions = useMemo(() => {
    const start = (effectivePage - 1) * pageSize
    return visibleTransactions.slice(start, start + pageSize)
  }, [effectivePage, pageSize, visibleTransactions])

  const summary = useMemo(() => getSummaryStats(visibleTransactions), [visibleTransactions])
  const kpiTrends = useMemo(() => getKpiTrends(visibleTransactions), [visibleTransactions])
  const balanceTrend = useMemo(() => getMonthlyBalanceTrend(visibleTransactions), [visibleTransactions])
  const spendingBreakdown = useMemo(() => getCategoryBreakdown(visibleTransactions), [visibleTransactions])
  const insights = useMemo(() => getInsights(visibleTransactions), [visibleTransactions])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
  }, [theme])

  function openAddDialog() {
    setDialogState({ open: true, mode: 'add', transaction: null })
  }

  function openEditDialog(transaction) {
    setDialogState({ open: true, mode: 'edit', transaction })
  }

  function closeDialog() {
    setDialogState({ open: false, mode: 'add', transaction: null })
  }

  function handleSubmitTransaction(values) {
    if (dialogState.mode === 'edit' && dialogState.transaction) {
      updateTransaction(dialogState.transaction.id, values)
      return
    }

    addTransaction(values)
  }

  function handleFilterChange(nextFilterValues) {
    setFilters(nextFilterValues)
  }

  function handleResetFilters() {
    resetFilters()
  }

  function handleCategoryDrill(category) {
    if (!category) {
      return
    }

    setFilters({ category })
  }

  function clearDrillFilters() {
    setFilters({
      category: 'all',
    })
  }

  const hasDrillFilters = filters.category !== 'all'
  const drillStatus = filters.category !== 'all' ? `Category: ${filters.category}` : ''

  return (

    <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 rounded-3xl border bg-white/75 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between dark:bg-[hsl(var(--card)/0.92)]">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-400/18 dark:text-indigo-200 dark:ring-indigo-400/30">
              <WalletCards size={16} />
            </span>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-indigo-100">Finance dashboard</p>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your financial command center</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Track balances, inspect transactions, and explore spending insights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={toggleTheme} aria-label="Toggle dark mode">
            {theme === 'light' ? <MoonStar size={15} /> : <Sun size={15} />} {theme === 'light' ? 'Dark' : 'Light'}
          </Button>

          <RoleSwitcher value={role} onChange={setRole} />

          {role === 'admin' ? (
            <Button size="sm" onClick={openAddDialog}>
              <Plus size={14} /> Add Transaction
            </Button>
          ) : null}
        </div>
      </header>

      <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50/85 px-3 py-2 text-sm text-indigo-900 dark:border-indigo-400/25 dark:bg-indigo-500/10 dark:text-indigo-200">
        Role switcher demo: choose <strong>Admin</strong> to add, edit, and delete transactions.
      </div>

      <section className="mt-8 space-y-4" aria-label="Transactions">
        <SummaryCards summary={summary} trends={kpiTrends} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Transactions</h2>
          <ExportActions transactions={visibleTransactions} />
        </div>

        <Card className="bg-white/75 backdrop-blur dark:bg-[hsl(var(--card))]">
          <CardContent className="space-y-4 pt-5">
            <Suspense fallback={<SectionFallback label="filters" />}>
              <TransactionFilters
                filters={filters}
                categories={categories}
                onChange={handleFilterChange}
                onReset={handleResetFilters}
              />
            </Suspense>
            <TransactionTable
              transactions={paginatedTransactions}
              filters={filters}
              onSortChange={handleFilterChange}
              role={role}
              onEdit={openEditDialog}
              onDelete={deleteTransaction}
              currentPage={effectivePage}
              totalPages={totalPages}
              totalItems={visibleTransactions.length}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      </section>

      <section className="mt-8 space-y-4" aria-label="Overview charts">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Overview Charts</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Click a pie slice to drill category into transaction filters.</p>
            {hasDrillFilters ? <p className="text-xs text-[hsl(var(--muted-foreground))]">Active drill: {drillStatus}</p> : null}
          </div>
          {hasDrillFilters ? (
            <Button type="button" size="sm" variant="secondary" onClick={clearDrillFilters}>
              <X size={14} /> Clear drill filter
            </Button>
          ) : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Suspense fallback={<SectionFallback label="balance trend" />}>
            <BalanceTrendChart data={balanceTrend} />
          </Suspense>
          <Suspense fallback={<SectionFallback label="spending breakdown" />}>
            <SpendingBreakdownChart data={spendingBreakdown} onCategorySelect={handleCategoryDrill} />
          </Suspense>
        </div>
      </section>

      <section className="mt-8 space-y-4" aria-label="Planning modules">
        <div>
          <h2 className="text-xl font-semibold">Planning Modules</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Compact planning widgets for budgets, upcoming bills, and daily cashflow intensity.</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <Suspense fallback={<SectionFallback label="budget planner" />}>
            <BudgetVsActual
              transactions={transactions}
              budgets={budgets}
              onBudgetChange={setCategoryBudget}
              role={role}
            />
          </Suspense>
          <Suspense fallback={<SectionFallback label="recurring forecast" />}>
            <RecurringForecast transactions={transactions} />
          </Suspense>
          <Suspense fallback={<SectionFallback label="cashflow heatmap" />}>
            <CashflowHeatmap transactions={visibleTransactions} />
          </Suspense>
        </div>
      </section>

      <section className="mt-8 space-y-3" aria-label="Insights">
        <h2 className="text-xl font-semibold">Insights</h2>
        <InsightsPanel insights={insights} />
      </section>

      {dialogState.open ? (
        <AddEditTransactionDialog
          mode={dialogState.mode}
          transaction={dialogState.transaction}
          categories={categories}
          onClose={closeDialog}
          onSubmit={handleSubmitTransaction}
        />
      ) : null}
    </main>
  )
}

export default App
