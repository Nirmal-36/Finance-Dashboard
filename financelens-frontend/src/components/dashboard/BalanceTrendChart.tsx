import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { BalancePoint } from '../../types'
import { Card } from '../ui/Primitives'
import { formatCompactCurrency, formatDate } from '../../lib/format'

export function BalanceTrendChart({ data }: { data: BalancePoint[] }) {
  const chartData = data.map((p) => ({ date: p.date, balance: parseFloat(p.running_balance) }))

  return (
    <Card className="p-6">
      <p className="text-sm text-paper-dim mb-4">Balance trend</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C9A92" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#7C9A92" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={(d) => new Date(d).getDate().toString()}
            stroke="#6B7280"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(v) => formatCompactCurrency(v)}
            stroke="#6B7280"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={56}
          />
          <Tooltip
            contentStyle={{
              background: '#1B222C',
              border: '1px solid #2A3340',
              borderRadius: 8,
              fontSize: 13,
            }}
            labelFormatter={(d) => formatDate(d as string)}
            formatter={(v) => [formatCompactCurrency(Number(v)), 'Balance']}
          />
          <Area type="monotone" dataKey="balance" stroke="#7C9A92" strokeWidth={2} fill="url(#balanceFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
