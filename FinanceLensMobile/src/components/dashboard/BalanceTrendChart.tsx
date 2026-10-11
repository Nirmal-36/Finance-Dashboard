import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { LineChart } from 'react-native-gifted-charts'
import type { BalancePoint } from '../../types'
import { Card } from '../ui/Primitives'
import { colors, spacing, fontSize } from '../../theme'

export function BalanceTrendChart({ data }: { data: BalancePoint[] }) {
  const chartData = data.map((p) => ({
    value: parseFloat(p.running_balance),
    label: String(new Date(p.date).getDate()),
  }))

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Balance trend</Text>
      <View style={styles.chartWrap}>
        <LineChart
          data={chartData}
          areaChart
          curved
          color={colors.signal}
          startFillColor={colors.signal}
          startOpacity={0.25}
          endOpacity={0.02}
          thickness={2}
          dataPointsColor={colors.signal}
          hideDataPoints
          xAxisColor={colors.ink700}
          yAxisColor={colors.ink700}
          yAxisTextStyle={{ color: colors.paperFaint, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: colors.paperFaint, fontSize: 10 }}
          noOfSections={4}
          height={180}
          initialSpacing={8}
          spacing={(300 - 16) / Math.max(chartData.length - 1, 1)}
          rulesColor={colors.ink800}
          rulesType="solid"
          yAxisLabelPrefix="₹"
          hideRules={false}
        />
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg },
  title: { color: colors.paperDim, fontSize: fontSize.sm, marginBottom: spacing.md },
  chartWrap: { marginLeft: -spacing.sm },
})
