import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Transaction } from '../../types'
import { formatCurrency, formatDate } from '../../lib/format'
import { colors, spacing, fontSize } from '../../theme'

const sourceLabel: Record<Transaction['source'], string> = {
  pdf_upload: 'PDF',
  device_capture: 'Live',
  manual: 'Manual',
}

export function TransactionRow({
  txn,
  isAdmin,
  onPress,
}: {
  txn: Transaction
  isAdmin: boolean
  onPress: () => void
}) {
  const isCredit = txn.type === 'credit'

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && isAdmin && styles.rowPressed]}
      onPress={isAdmin ? onPress : undefined}
    >
      <View style={styles.main}>
        <Text style={styles.merchant} numberOfLines={1}>
          {txn.merchant_normalized || txn.merchant_raw}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.date}>{formatDate(txn.txn_timestamp)}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.source}>{sourceLabel[txn.source]}</Text>
        </View>
        {txn.category ? (
          <View style={styles.categoryRow}>
            <View style={[styles.catDot, { backgroundColor: txn.category.color }]} />
            <Text style={styles.categoryText}>{txn.category.name}</Text>
          </View>
        ) : (
          <Text style={styles.uncategorized}>Uncategorized</Text>
        )}
      </View>
      <Text style={[styles.amount, { color: isCredit ? colors.signal : colors.paper }]}>
        {isCredit ? '+' : '-'}
        {formatCurrency(txn.amount)}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink800,
  },
  rowPressed: { backgroundColor: colors.ink850 },
  main: { flex: 1, marginRight: spacing.sm },
  merchant: { color: colors.paper, fontSize: fontSize.base },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 },
  date: { color: colors.paperFaint, fontSize: fontSize.xs },
  dot: { color: colors.paperFaint, fontSize: fontSize.xs },
  source: { color: colors.paperFaint, fontSize: fontSize.xs },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  catDot: { width: 6, height: 6, borderRadius: 3 },
  categoryText: { color: colors.paperDim, fontSize: fontSize.xs },
  uncategorized: { color: colors.paperFaint, fontSize: fontSize.xs, marginTop: 4 },
  amount: { fontSize: fontSize.base, fontWeight: '600' },
})
