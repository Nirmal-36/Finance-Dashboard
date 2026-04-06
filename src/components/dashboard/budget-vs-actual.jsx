import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HelpHint } from '@/components/ui/help-hint'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { getBudgetVsActual } from '@/lib/finance'

function formatMonth(monthKey) {
  if (!monthKey) {
    return '--'
  }

  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(new Date(`${monthKey}-01`))
}

export function BudgetVsActual({ transactions, budgets, onBudgetChange, role }) {
  const rows = useMemo(() => getBudgetVsActual(transactions, budgets), [transactions, budgets])
  const canEdit = role === 'admin'

  return (
    <Card className="bg-white/75 backdrop-blur dark:bg-[hsl(var(--card))]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          Budget vs Actual
          <HelpHint text="Set monthly category budgets and compare current month actual spending." />
        </CardTitle>
        <CardDescription className="text-xs">Monthly category budgets for {formatMonth(rows[0]?.month)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No expense data available for budget tracking.</p>
        ) : (
          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {rows.map((row) => (
              <div key={row.category} className="rounded-lg border p-2.5">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">{row.category}</p>
                  {row.isOverBudget ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
                      <AlertTriangle size={12} /> Over
                    </span>
                  ) : null}
                </div>

                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                  <div
                    className={row.isOverBudget ? 'h-full bg-rose-500' : 'h-full bg-[hsl(var(--primary))]'}
                    style={{ width: `${Math.min(row.progress, 100)}%` }}
                  />
                </div>

                <div className="grid gap-2 text-xs sm:grid-cols-3 sm:items-end">
                  <p>
                    <span className="text-[hsl(var(--muted-foreground))]">Actual</span><br />
                    <span className="font-semibold">{formatCurrency(row.actual)}</span>
                  </p>
                  <p>
                    <span className="text-[hsl(var(--muted-foreground))]">Remaining</span><br />
                    <span className={`font-semibold ${row.isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{formatCurrency(row.remaining)}</span>
                  </p>
                  {canEdit ? (
                    <label>
                      <span className="mb-1 block text-[11px] text-[hsl(var(--muted-foreground))]">Budget</span>
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        value={budgets[row.category] ?? 0}
                        onChange={(event) => onBudgetChange(row.category, Number(event.target.value) || 0)}
                        className="h-8 text-xs"
                      />
                    </label>
                  ) : (
                    <p>
                      <span className="text-[hsl(var(--muted-foreground))]">Budget</span><br />
                      <span className="font-semibold">{formatCurrency(budgets[row.category] ?? 0)}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
