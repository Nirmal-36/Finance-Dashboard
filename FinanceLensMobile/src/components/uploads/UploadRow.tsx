import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { StatementUpload } from '../../types'
import { Card } from '../ui/Primitives'
import { UploadStatusBadge } from './UploadStatusBadge'
import { formatDate } from '../../lib/format'
import { colors, spacing, fontSize } from '../../theme'

export function UploadRow({ upload }: { upload: StatementUpload }) {
  const isProcessing = upload.status === 'queued' || upload.status === 'parsing' || upload.status === 'categorizing'

  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.filename} numberOfLines={1}>
          {upload.original_filename}
        </Text>
        <UploadStatusBadge status={upload.status} />
      </View>

      <Text style={styles.date}>{formatDate(upload.created_at, { withTime: true })}</Text>

      {upload.status === 'completed' && (
        <Text style={styles.summary}>
          {upload.transactions_imported} imported
          {upload.transactions_skipped_duplicate > 0 ? ` · ${upload.transactions_skipped_duplicate} duplicate(s) skipped` : ''}
        </Text>
      )}

      {upload.status === 'failed' && upload.error_message && (
        <Text style={styles.errorText} numberOfLines={2}>
          {upload.error_message}
        </Text>
      )}

      {isProcessing && <Text style={styles.processingText}>Found {upload.transactions_found} transaction(s) so far…</Text>}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.xs },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  filename: { color: colors.paper, fontSize: fontSize.base, fontWeight: '600', flex: 1 },
  date: { color: colors.paperFaint, fontSize: fontSize.xs },
  summary: { color: colors.signal, fontSize: fontSize.sm, marginTop: 2 },
  errorText: { color: colors.coral, fontSize: fontSize.sm, marginTop: 2 },
  processingText: { color: colors.amber, fontSize: fontSize.sm, marginTop: 2 },
})
