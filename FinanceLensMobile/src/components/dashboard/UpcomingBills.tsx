import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { UpcomingBillItem } from '../../types'
import { Card, EmptyState, Badge } from '../ui/Primitives'
import { formatCurrency, formatRelativeDate } from '../../lib/format'
import { colors, spacing, fontSize } from '../../theme'

const confidenceTone = { high: 'signal', medium: 'amber', low: 'neutral' } as const

export function UpcomingBills({ bills }: { bills: UpcomingBillItem[] }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Upcoming bills (next 30 days)</Text>
      {bills.length === 0 ? (
        <EmptyState
          title="Nothing recurring detected yet"
          description="Once a merchant shows up a few times on a monthly cadence, it'll appear here."
        />
      ) : (
        <View style={styles.list}>
          {bills.map((bill, i) => (
            <View key={i} style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.merchant} numberOfLines={1}>
                  {bill.merchant_normalized}
                </Text>
                <Text style={styles.date}>{formatRelativeDate(bill.predicted_date)}</Text>
              </View>
              <View style={styles.rowRight}>
                <Badge tone={confidenceTone[bill.confidence]}>{bill.confidence}</Badge>
                <Text style={styles.amount}>{formatCurrency(bill.predicted_amount)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg },
  title: { color: colors.paperDim, fontSize: fontSize.sm, marginBottom: spacing.md },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink800,
  },
  rowLeft: { flex: 1, marginRight: spacing.sm },
  merchant: { color: colors.paper, fontSize: fontSize.sm },
  date: { color: colors.paperFaint, fontSize: fontSize.xs, marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  amount: { color: colors.paper, fontSize: fontSize.sm, fontWeight: '600' },
})
