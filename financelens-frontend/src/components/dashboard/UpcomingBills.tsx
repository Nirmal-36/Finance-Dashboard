import { CalendarClock } from 'lucide-react'
import type { UpcomingBillItem } from '../../types'
import { Card, EmptyState, Badge } from '../ui/Primitives'
import { formatCurrency, formatRelativeDate } from '../../lib/format'

const confidenceTone = { high: 'signal', medium: 'amber', low: 'neutral' } as const

export function UpcomingBills({ bills }: { bills: UpcomingBillItem[] }) {
  return (
    <Card className="p-6">
      <p className="text-sm text-paper-dim mb-4">Upcoming bills (next 30 days)</p>
      {bills.length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="h-7 w-7" strokeWidth={1.5} />}
          title="Nothing recurring detected yet"
          description="Once a merchant shows up a few times on a monthly cadence, it'll appear here."
        />
      ) : (
        <ul className="divide-y divide-ink-800">
          {bills.map((bill, i) => (
            <li key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="text-sm text-paper truncate">{bill.merchant_normalized}</p>
                <p className="text-xs text-paper-faint">{formatRelativeDate(bill.predicted_date)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge tone={confidenceTone[bill.confidence]}>{bill.confidence}</Badge>
                <span className="text-sm tabular text-paper">{formatCurrency(bill.predicted_amount)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
