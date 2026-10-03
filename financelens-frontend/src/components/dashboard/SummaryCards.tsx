import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { SummaryData } from '../../types'
import { formatCurrency } from '../../lib/format'
import { Card } from '../ui/Primitives'

function Trend({ pct, invert }: { pct: number | null; invert?: boolean }) {
  if (pct === null) return <span className="text-xs text-paper-faint">No prior data</span>
  const isUp = pct > 0
  // For expenses, "up" is bad (coral); for income, "up" is good (signal).
  const isGood = invert ? !isUp : isUp
  const Icon = isUp ? ArrowUpRight : ArrowDownRight

  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isGood ? 'text-signal' : 'text-coral'}`}>
      <Icon className="h-3 w-3" strokeWidth={2} />
      {Math.abs(pct).toFixed(1)}% vs last period
    </span>
  )
}

export function SummaryCards({ data }: { data: SummaryData }) {
  const balance = parseFloat(data.total_balance)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card className="p-6 sm:col-span-1">
        <p className="text-sm text-paper-dim mb-2">Total balance</p>
        <p
          className={`font-display text-3xl tabular ${balance < 0 ? 'text-coral' : 'text-paper'}`}
        >
          {formatCurrency(data.total_balance, { signed: false })}
        </p>
        <p className="text-xs text-paper-faint mt-2">All-time, across accounts</p>
      </Card>

      <Card className="p-6">
        <p className="text-sm text-paper-dim mb-2">Income this period</p>
        <p className="font-display text-2xl tabular text-signal">{formatCurrency(data.total_income)}</p>
        <div className="mt-2">
          <Trend pct={data.income_trend_pct} />
        </div>
      </Card>

      <Card className="p-6">
        <p className="text-sm text-paper-dim mb-2">Expenses this period</p>
        <p className="font-display text-2xl tabular text-amber">{formatCurrency(data.total_expenses)}</p>
        <div className="mt-2">
          <Trend pct={data.expense_trend_pct} invert />
        </div>
      </Card>
    </div>
  )
}
