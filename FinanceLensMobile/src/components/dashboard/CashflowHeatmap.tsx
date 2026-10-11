import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { HeatmapDay } from '../../types'
import { Card } from '../ui/Primitives'
import { monthName } from '../../lib/format'
import { colors, spacing, fontSize } from '../../theme'

function intensityColor(amount: number, max: number): string {
  if (amount === 0) return colors.ink850
  const ratio = amount / max
  if (ratio > 0.75) return colors.amber
  if (ratio > 0.5) return 'rgba(212,162,76,0.7)'
  if (ratio > 0.25) return 'rgba(212,162,76,0.45)'
  return 'rgba(212,162,76,0.25)'
}

export function CashflowHeatmap({ days, year, month }: { days: HeatmapDay[]; year: number; month: number }) {
  const max = Math.max(...days.map((d) => parseFloat(d.total_spent)), 1)
  const firstDay = new Date(year, month - 1, 1).getDay()
  const leadingBlanks = Array((firstDay + 6) % 7).fill(null)

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>
        Cashflow heatmap — {monthName(month)} {year}
      </Text>
      <View style={styles.weekLabels}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Text key={i} style={styles.weekLabel}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {leadingBlanks.map((_, i) => (
          <View key={`b${i}`} style={styles.cell} />
        ))}
        {days.map((day) => {
          const amount = parseFloat(day.total_spent)
          const dayNum = new Date(day.date).getDate()
          const bg = intensityColor(amount, max)
          return (
            <View key={day.date} style={[styles.cell, styles.dayCell, { backgroundColor: bg }]}>
              <Text style={[styles.dayText, amount > max * 0.5 && styles.dayTextDark]}>{dayNum}</Text>
            </View>
          )
        })}
      </View>
    </Card>
  )
}

const CELL_PCT = `${100 / 7}%` as const

const styles = StyleSheet.create({
  card: { padding: spacing.lg },
  title: { color: colors.paperDim, fontSize: fontSize.sm, marginBottom: spacing.md },
  weekLabels: { flexDirection: 'row', marginBottom: spacing.xs },
  weekLabel: { width: CELL_PCT, textAlign: 'center', color: colors.paperFaint, fontSize: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL_PCT, aspectRatio: 1, padding: 2 },
  dayCell: { borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 10, color: colors.paperFaint },
  dayTextDark: { color: colors.ink950 },
})
