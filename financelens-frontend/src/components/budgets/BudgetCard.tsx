import type { BudgetVsActualItem } from '../../types'
import { formatCurrency } from '../../lib/format'
import { cx } from '../../lib/format'

export function BudgetCard({ item }: { item: BudgetVsActualItem }) {
  const pct = Math.min(item.percentage_used, 100)

  return (
    <div className="py-4 border-b border-ink-800 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
          <span className="text-sm text-paper">{item.category_name}</span>
        </div>
        <span className="text-sm tabular text-paper-dim">
          {formatCurrency(item.actual_amount)} / {formatCurrency(item.budget_amount)}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-ink-800 overflow-hidden">
        <div
          className={cx('h-full rounded-full transition-all', item.is_over_budget ? 'bg-coral' : 'bg-signal')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {item.is_over_budget && (
        <p className="text-xs text-coral mt-1.5">
          {(item.percentage_used - 100).toFixed(0)}% over budget
        </p>
      )}
    </div>
  )
}
