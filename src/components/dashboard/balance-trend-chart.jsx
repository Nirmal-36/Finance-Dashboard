import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

export function BalanceTrendChart({ data }) {
  return (
    <Card className="bg-white/75 backdrop-blur dark:bg-[hsl(var(--card))]">
      <CardHeader>
        <CardTitle>Balance Trend</CardTitle>
        <CardDescription>Running balance progression by month</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        {data.length === 0 ? (
          <p className="grid h-full place-items-center text-sm text-[hsl(var(--muted-foreground))]">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 12, left: 4, bottom: 6 }}>
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis tickFormatter={(value) => formatCurrency(value, { maximumFractionDigits: 0 })} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Line type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
