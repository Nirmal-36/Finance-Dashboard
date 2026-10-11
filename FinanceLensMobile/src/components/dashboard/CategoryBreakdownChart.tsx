import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { PieChart } from 'react-native-gifted-charts'
import type { CategoryBreakdownItem } from '../../types'
import { Card, EmptyState } from '../ui/Primitives'
import { colors, spacing, fontSize } from '../../theme'

export function CategoryBreakdownChart({
  data,
  onCategoryPress,
}: {
  data: CategoryBreakdownItem[]
  onCategoryPress?: (categoryId: string | null) => void
}) {
  if (data.length === 0) {
    return (
      <Card style={styles.card}>
        <Text style={styles.title}>Spending by category</Text>
        <EmptyState
          title="No categorized spending yet"
          description="Upload a statement or add a transaction to see the breakdown."
        />
      </Card>
    )
  }

  const pieData = data.map((item) => ({
    value: parseFloat(item.total_amount),
    color: item.color,
    text: '',
  }))

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Spending by category</Text>
      <View style={styles.row}>
        <PieChart data={pieData} donut radius={72} innerRadius={48} />
        <View style={styles.legend}>
          {data.slice(0, 6).map((item) => (
            <Pressable
              key={item.category_id ?? 'uncategorized'}
              style={styles.legendRow}
              onPress={() => onCategoryPress?.(item.category_id)}
            >
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.legendLabel} numberOfLines={1}>
                {item.category_name}
              </Text>
              <Text style={styles.legendPct}>{item.percentage.toFixed(0)}%</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg },
  title: { color: colors.paperDim, fontSize: fontSize.sm, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  legend: { flex: 1, gap: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { flex: 1, color: colors.paperDim, fontSize: fontSize.sm },
  legendPct: { color: colors.paperDim, fontSize: fontSize.sm },
})
