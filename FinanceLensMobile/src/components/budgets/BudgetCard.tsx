import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { BudgetVsActualItem } from '../../types'
import { Card } from '../ui/Primitives'
import { formatCurrency } from '../../lib/format'
import { colors, spacing, fontSize } from '../../theme'

export function BudgetCard({
  item,
  onPress,
}: {
  item: BudgetVsActualItem
  onPress: () => void
}) {
  const pct = Math.min(item.percentage_used, 100)
  const barColor = item.is_over_budget ? colors.coral : colors.signal

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.nameRow}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.name}>{item.category_name}</Text>
          </View>
          <Text style={[styles.pct, item.is_over_budget && styles.pctOver]}>
            {Math.round(item.percentage_used)}%
          </Text>
        </View>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
        </View>

        <View style={styles.amountsRow}>
          <Text style={styles.spent}>
            {formatCurrency(item.actual_amount)} <Text style={styles.ofText}>of {formatCurrency(item.budget_amount)}</Text>
          </Text>
          {item.is_over_budget && <Text style={styles.overLabel}>Over budget</Text>}
        </View>
      </Card>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { color: colors.paper, fontSize: fontSize.base, fontWeight: '600' },
  pct: { color: colors.paperDim, fontSize: fontSize.sm, fontWeight: '600' },
  pctOver: { color: colors.coral },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.ink800,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
  amountsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  spent: { color: colors.paperDim, fontSize: fontSize.sm },
  ofText: { color: colors.paperFaint },
  overLabel: { color: colors.coral, fontSize: fontSize.xs, fontWeight: '600' },
})
