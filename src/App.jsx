import { useEffect, useMemo, useState } from 'react'
import { MoonStar, Plus, Sun, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RoleSwitcher } from '@/components/role-switcher'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { BalanceTrendChart } from '@/components/dashboard/balance-trend-chart'
import { SpendingBreakdownChart } from '@/components/dashboard/spending-breakdown-chart'
import { InsightsPanel } from '@/components/dashboard/insights-panel'
import { TransactionFilters } from '@/components/transactions/transaction-filters'
import { TransactionTable } from '@/components/transactions/transaction-table'
import { AddEditTransactionDialog } from '@/components/add-edit-transaction-dialog'
import { ExportActions } from '@/components/export-actions'
import {
  getCategories,
  filterAndSortTransactions,
  getSummaryStats,
  getMonthlyBalanceTrend,
  getCategoryBreakdown,
  getInsights,
} from '@/lib/finance'
import { useFinanceStore } from '@/store/useFinanceStore'

function App() {
  const {
    role,
    setRole,
    filters,
    setFilters,
    resetFilters,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    theme,
    toggleTheme,
  } = useFinanceStore()

  const [dialogState, setDialogState] = useState({ open: false, mode: 'add', transaction: null })

  const categories = useMemo(() => getCategories(transactions), [transactions])
  const visibleTransactions = useMemo(() => filterAndSortTransactions(transactions, filters), [transactions, filters])
  const summary = useMemo(() => getSummaryStats(visibleTransactions), [visibleTransactions])
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

  return (
    <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <header className="mb-6 flex flex-col gap-4 rounded-3xl border bg-white/70 p-4 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between dark:bg-[hsl(var(--card))]">
        <div>
          <p className="mb-1 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
            <WalletCards size={12} /> Finance dashboard
          </p>
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

      <div className="mb-4 rounded-xl border bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
        Role switcher demo: choose <strong>Admin</strong> to add, edit, and delete transactions.
      </div>

      <section className="space-y-4">
        <SummaryCards summary={summary} />

        <div className="grid gap-4 lg:grid-cols-2">
          <BalanceTrendChart data={balanceTrend} />
          <SpendingBreakdownChart data={spendingBreakdown} />
        </div>
      </section>

      <section className="mt-8 space-y-4" aria-label="Transactions">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Transactions</h2>
          <ExportActions transactions={visibleTransactions} />
        </div>

        <Card className="bg-white/75 backdrop-blur dark:bg-[hsl(var(--card))]">
          <CardContent className="space-y-4 pt-5">
            <TransactionFilters filters={filters} categories={categories} onChange={setFilters} onReset={resetFilters} />
            <TransactionTable
              transactions={visibleTransactions}
              filters={filters}
              onSortChange={setFilters}
              role={role}
              onEdit={openEditDialog}
              onDelete={deleteTransaction}
            />
          </CardContent>
        </Card>
      </section>

      <section className="mt-8 space-y-3" aria-label="Insights">
        <h2 className="text-xl font-semibold">Insights</h2>
        <InsightsPanel insights={insights} />
      </section>

      <AddEditTransactionDialog
        open={dialogState.open}
        mode={dialogState.mode}
        transaction={dialogState.transaction}
        categories={categories}
        onClose={closeDialog}
        onSubmit={handleSubmitTransaction}
      />
    </main>
  )
}

export default App
