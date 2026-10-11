import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { SummaryData } from '../../types'
import { formatCurrency } from '../../lib/format'
import { Card } from '../ui/Primitives'
import { colors, spacing, fontSize } from '../../theme'

function Trend({ pct, invert }: { pct: number | null; invert?: boolean }) {
  if (pct === null) return <Text style={styles.trendNone}>No prior data</Text>
  const isUp = pct > 0
  const isGood = invert ? !isUp : isUp
  return (
    <Text style={[styles.trend, { color: isGood ? colors.signal : colors.coral }]}>
      {isUp ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}% vs last period
    </Text>
  )
}

export function SummaryCards({ data }: { data: SummaryData }) {
  const balance = parseFloat(data.total_balance)

  return (
    <View style={styles.wrap}>
      <Card style={styles.balanceCard}>
        <Text style={styles.label}>Total balance</Text>
        <Text style={[styles.balanceValue, { color: balance < 0 ? colors.coral : colors.paper }]}>
          {formatCurrency(data.total_balance)}
        </Text>
        <Text style={styles.hint}>All-time, across accounts</Text>
      </Card>

      <View style={styles.row}>
        <Card style={styles.halfCard}>
          <Text style={styles.label}>Income</Text>
          <Text style={[styles.value, { color: colors.signal }]}>{formatCurrency(data.total_income)}</Text>
          <Trend pct={data.income_trend_pct} />
        </Card>
        <Card style={styles.halfCard}>
          <Text style={styles.label}>Expenses</Text>
          <Text style={[styles.value, { color: colors.amber }]}>{formatCurrency(data.total_expenses)}</Text>
          <Trend pct={data.expense_trend_pct} invert />
        </Card>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  balanceCard: { padding: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  halfCard: { flex: 1, padding: spacing.lg },
  label: { fontSize: fontSize.sm, color: colors.paperDim, marginBottom: spacing.xs },
  balanceValue: { fontSize: 32, fontWeight: '700' },
  value: { fontSize: fontSize.xl, fontWeight: '700' },
  hint: { fontSize: fontSize.xs, color: colors.paperFaint, marginTop: spacing.xs },
  trend: { fontSize: fontSize.xs, fontWeight: '600', marginTop: spacing.xs },
  trendNone: { fontSize: fontSize.xs, color: colors.paperFaint, marginTop: spacing.xs },
})
