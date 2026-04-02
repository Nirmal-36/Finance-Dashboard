import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

export function SummaryCards({ summary }) {
  const cards = [
    {
      label: 'Total Balance',
      value: summary.balance,
      icon: Wallet,
      valueClassName: summary.balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Income',
      value: summary.income,
      icon: ArrowUpRight,
      valueClassName: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Expenses',
      value: summary.expenses,
      icon: ArrowDownRight,
      valueClassName: 'text-rose-600 dark:text-rose-400',
    },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Financial summary cards">
      {cards.map((card) => (
        <Card key={card.label} className="bg-white/75 backdrop-blur dark:bg-[hsl(var(--card))]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>{card.label}</CardTitle>
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
