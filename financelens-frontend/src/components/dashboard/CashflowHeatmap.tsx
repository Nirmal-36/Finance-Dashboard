import type { HeatmapDay } from '../../types'
import { Card } from '../ui/Primitives'
import { formatCurrency, monthName } from '../../lib/format'
import { cx } from '../../lib/format'

function intensityClass(amount: number, max: number): string {
  if (amount === 0) return 'bg-ink-850'
  const ratio = amount / max
  if (ratio > 0.75) return 'bg-amber'
  if (ratio > 0.5) return 'bg-amber/70'
  if (ratio > 0.25) return 'bg-amber/45'
  return 'bg-amber/25'
}

export function CashflowHeatmap({ days, year, month }: { days: HeatmapDay[]; year: number; month: number }) {
  const max = Math.max(...days.map((d) => parseFloat(d.total_spent)), 1)
  const firstDay = new Date(year, month - 1, 1).getDay()
  const leadingBlanks = Array((firstDay + 6) % 7).fill(null) // Monday-first week

  return (
    <Card className="p-6">
      <p className="text-sm text-paper-dim mb-4">
        Cashflow heatmap — {monthName(month)} {year}
      </p>
      <div className="grid grid-cols-7 gap-1.5">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} className="text-center text-xs text-paper-faint pb-1">
            {d}
          </div>
        ))}
        {leadingBlanks.map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const amount = parseFloat(day.total_spent)
          const dayNum = new Date(day.date).getDate()
          return (
            <div
              key={day.date}
              title={`${day.date}: ${formatCurrency(amount)} (${day.transaction_count} txns)`}
              className={cx(
                'aspect-square rounded flex items-center justify-center text-[10px] tabular cursor-default',
                intensityClass(amount, max),
                amount > max * 0.5 ? 'text-ink-950' : 'text-paper-faint'
              )}
            >
              {dayNum}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
