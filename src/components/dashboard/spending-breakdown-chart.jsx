import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HelpHint } from '@/components/ui/help-hint'
import { formatCurrency } from '@/lib/utils'

const categoryColorMap = {
  Groceries: '#22c55e',
  Rent: '#6366f1',
  Utilities: '#06b6d4',
  Dining: '#f59e0b',
  Entertainment: '#ec4899',
  Transport: '#f97316',
  Freelance: '#8b5cf6',
  Salary: '#3b82f6',
  Reimbursements: '#14b8a6',
}

const fallbackColors = ['#7c3aed', '#2563eb', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444']

function getCategoryColor(categoryName) {
  if (categoryColorMap[categoryName]) {
    return categoryColorMap[categoryName]
  }

  const hash = Array.from(categoryName).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return fallbackColors[hash % fallbackColors.length]
}

export function SpendingBreakdownChart({ data, onCategorySelect }) {
  return (
    <Card className="bg-white/75 backdrop-blur dark:bg-[hsl(var(--card))]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Spending Breakdown
          <HelpHint text="Click any category slice to filter the transactions table by that category." />
        </CardTitle>
        <CardDescription>Expense categories based on active filters</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        {data.length === 0 ? (
          <p className="grid h-full place-items-center text-sm text-[hsl(var(--muted-foreground))]">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={108}
                  paddingAngle={3}
                  onClick={(entry) => onCategorySelect?.(entry?.name)}
                >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={getCategoryColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
