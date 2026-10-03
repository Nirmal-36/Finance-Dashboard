import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { CategoryBreakdownItem } from '../../types'
import { Card, EmptyState } from '../ui/Primitives'
import { formatCurrency } from '../../lib/format'
import { PieChart as PieIcon } from 'lucide-react'

export function CategoryBreakdownChart({
  data,
  onCategoryClick,
}: {
  data: CategoryBreakdownItem[]
  onCategoryClick?: (categoryId: string | null) => void
}) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-paper-dim mb-4">Spending by category</p>
        <EmptyState
          icon={<PieIcon className="h-8 w-8" strokeWidth={1.5} />}
          title="No categorized spending yet"
          description="Upload a statement or add a transaction to see the breakdown."
        />
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <p className="text-sm text-paper-dim mb-4">Spending by category</p>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total_amount"
              nameKey="category_name"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={2}
              onClick={(_, index) => onCategoryClick?.(data[index]?.category_id ?? null)}
              cursor={onCategoryClick ? 'pointer' : 'default'}
            >
              {data.map((entry) => (
                <Cell key={entry.category_id ?? 'uncategorized'} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#1B222C',
                border: '1px solid #2A3340',
                borderRadius: 8,
                fontSize: 13,
              }}
              formatter={(v) => formatCurrency(Number(v))}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex-1 space-y-2 min-w-0">
          {data.slice(0, 6).map((item) => (
            <button
              key={item.category_id ?? 'uncategorized'}
              onClick={() => onCategoryClick?.(item.category_id)}
              className="flex w-full items-center gap-2 text-left hover:opacity-80 transition-opacity"
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
              <span className="flex-1 truncate text-sm text-paper-dim">{item.category_name}</span>
              <span className="text-sm tabular text-paper-dim">{item.percentage.toFixed(0)}%</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}
