import { useMemo } from 'react'
import { BellRing } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HelpHint } from '@/components/ui/help-hint'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getUpcomingRecurringForecast } from '@/lib/finance'

export function RecurringForecast({ transactions }) {
  const upcoming = useMemo(() => getUpcomingRecurringForecast(transactions, 30), [transactions])

  return (
    <Card className="bg-white/75 backdrop-blur dark:bg-[hsl(var(--card))]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <BellRing size={16} /> Upcoming Bills (30 days)
          <HelpHint text="Forecast generated from transactions marked as recurring." />
        </CardTitle>
        <CardDescription className="text-xs">{upcoming.length} recurring transactions due in next 30 days</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {upcoming.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No recurring transactions in the next 30 days.</p>
        ) : (
          <div className="max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
            {upcoming.slice(0, 8).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.description}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.category} • {formatDate(item.date)}</p>
                </div>
                <div className="ml-3 shrink-0 text-right">
                  <p className="text-xs font-semibold">{formatCurrency(item.amount)}</p>
                  <Badge tone={item.type} className="text-[10px]">{item.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
