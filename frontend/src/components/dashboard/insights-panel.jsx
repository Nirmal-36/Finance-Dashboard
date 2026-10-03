import { ArrowDown, ArrowUp, ReceiptText, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

export function InsightsPanel({ insights }) {
  const monthDelta = insights.monthOverMonth
  const monthDeltaText =
    monthDelta === null
      ? 'No prior month to compare'
      : `${Math.abs(monthDelta).toFixed(1)}% ${monthDelta >= 0 ? 'increase' : 'decrease'} in spending`

  return (
    <section className="grid gap-4 lg:grid-cols-3" aria-label="Insights panel">
      <Card className="bg-white/75 backdrop-blur dark:bg-[hsl(var(--card))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles size={16} /> Top Spending Category
          </CardTitle>
          <CardDescription>Largest expense concentration</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{insights.topSpendingCategory?.name ?? 'N/A'}</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {insights.topSpendingCategory ? formatCurrency(insights.topSpendingCategory.value) : 'No expense data'}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white/75 backdrop-blur dark:bg-[hsl(var(--card))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {monthDelta !== null && monthDelta >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />} Month over Month
          </CardTitle>
          <CardDescription>Current vs previous month expense trend</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{monthDelta === null ? '--' : `${monthDelta.toFixed(1)}%`}</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{monthDeltaText}</p>
        </CardContent>
      </Card>

      <Card className="bg-white/75 backdrop-blur dark:bg-[hsl(var(--card))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ReceiptText size={16} /> Additional Observation
          </CardTitle>
          <CardDescription>Average transaction + activity</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{formatCurrency(insights.averageTransaction)}</p>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{insights.transactionsThisMonth} transactions this month</p>
        </CardContent>
      </Card>
    </section>
  )
}
