import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HelpHint } from '@/components/ui/help-hint'
import { formatCurrency } from '@/lib/utils'

function TrendChip({ value }) {
  if (value === null || Number.isNaN(value)) {
    return <span className="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-xs text-[hsl(var(--muted-foreground))]">--</span>
  }

  const positive = value >= 0
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        positive
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
          : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
      }`}
    >
      {positive ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  )
}

export function SummaryCards({ summary, trends }) {
  const cards = [
    {
      label: 'Total Balance',
      value: summary.balance,
      trend: trends.balance,
      icon: Wallet,
      valueClassName: summary.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Income',
      value: summary.income,
      trend: trends.income,
      icon: ArrowUpRight,
      valueClassName: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Expenses',
      value: summary.expenses,
      trend: trends.expenses,
      icon: ArrowDownRight,
      valueClassName: 'text-rose-600 dark:text-rose-400',
    },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Financial summary cards">
      {cards.map((card) => (
        <Card key={card.label} className="bg-white/75 backdrop-blur dark:bg-[hsl(var(--card))]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle>{card.label}</CardTitle>
              <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                <span>vs prev month</span>
                <TrendChip value={card.trend} />
                <HelpHint text="Compares this card metric with previous month based on current filters." />
              </div>
            </div>
            <card.icon size={18} className="text-[hsl(var(--muted-foreground))]" />
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold tracking-tight ${card.valueClassName}`}>{formatCurrency(card.value)}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
