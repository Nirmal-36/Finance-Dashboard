import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HelpHint } from '@/components/ui/help-hint'
import { formatCurrency } from '@/lib/utils'
import { getCashflowHeatmapData } from '@/lib/finance'

function getIntensityClass(intensity) {
  if (intensity === 0) {
    return 'bg-[hsl(var(--muted))]'
  }
  if (intensity < 0.25) {
    return 'bg-indigo-200 dark:bg-indigo-900'
  }
  if (intensity < 0.5) {
    return 'bg-indigo-300 dark:bg-indigo-700'
  }
  if (intensity < 0.75) {
    return 'bg-indigo-400 dark:bg-indigo-500'
  }
  return 'bg-indigo-600 dark:bg-indigo-300'
}

function formatMonth(monthKey) {
  if (!monthKey) {
    return '--'
  }

  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(`${monthKey}-01`))
}

export function CashflowHeatmap({ transactions }) {
  const heatmap = useMemo(() => getCashflowHeatmapData(transactions), [transactions])

  return (
    <Card className="bg-white/75 backdrop-blur dark:bg-[hsl(var(--card))]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          Cashflow Heatmap
          <HelpHint text="Each day cell shade indicates relative expense intensity for the active month." />
        </CardTitle>
        <CardDescription className="text-xs">Daily expense intensity for {formatMonth(heatmap.activeMonth)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {heatmap.days.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">No expense data available.</p>
        ) : (
          <>
            <div className="flex items-center justify-end gap-2 text-[10px] text-[hsl(var(--muted-foreground))]">
              <span>Low</span>
              <span className="h-2 w-2 rounded-sm bg-indigo-200 dark:bg-indigo-900" />
              <span className="h-2 w-2 rounded-sm bg-indigo-400 dark:bg-indigo-500" />
              <span className="h-2 w-2 rounded-sm bg-indigo-600 dark:bg-indigo-300" />
              <span>High</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[hsl(var(--muted-foreground))]">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {heatmap.days.map((cell) => (
                <div
                  key={cell.id}
                  className={`group relative h-8 rounded-md border text-center text-[11px] leading-8 ${cell.empty ? 'border-transparent bg-transparent' : getIntensityClass(cell.intensity)}`}
                >
                  {cell.empty ? '' : cell.day}
                  {!cell.empty ? (
                    <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 w-max -translate-x-1/2 rounded-md border bg-[hsl(var(--card))] px-2 py-1 text-xs text-[hsl(var(--card-foreground))] opacity-0 shadow-lg transition duration-100 group-hover:opacity-100">
                      Day {cell.day}: {formatCurrency(cell.expense)}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
