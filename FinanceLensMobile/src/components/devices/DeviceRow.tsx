import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { Device } from '../../types'
import { Card, Badge } from '../ui/Primitives'
import { formatDate } from '../../lib/format'
import { colors, spacing, fontSize } from '../../theme'

export function DeviceRow({
  device,
  onRevoke,
  onPair,
}: {
  device: Device
  onRevoke: () => void
  onPair: () => void
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.main}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{device.device_name}</Text>
          <Badge tone={device.is_active ? 'signal' : 'neutral'}>{device.is_active ? 'Active' : 'Revoked'}</Badge>
        </View>
        <Text style={styles.meta}>
          {device.last_seen_at ? `Last seen ${formatDate(device.last_seen_at, { withTime: true })}` : 'Never checked in'}
        </Text>
        <Text style={styles.meta}>Registered {formatDate(device.created_at)}</Text>
      </View>
      {device.is_active && (
        <View style={styles.actions}>
          <Pressable style={styles.pairBtn} onPress={onPair}>
            <Text style={styles.pairText}>Get pairing code</Text>
          </Pressable>
          <Pressable style={styles.revokeBtn} onPress={onRevoke}>
            <Text style={styles.revokeText}>Revoke</Text>
          </Pressable>
        </View>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  main: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { color: colors.paper, fontSize: fontSize.base, fontWeight: '600' },
  meta: { color: colors.paperFaint, fontSize: fontSize.xs },
  actions: { gap: spacing.sm, alignItems: 'stretch' },
  pairBtn: {
    borderWidth: 1,
    borderColor: colors.signalDim,
    backgroundColor: 'rgba(124,154,146,0.12)',
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    alignItems: 'center',
  },
  pairText: { color: colors.signal, fontSize: fontSize.xs, fontWeight: '600' },
  revokeBtn: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(224,98,76,0.3)',
    backgroundColor: 'rgba(224,98,76,0.1)',
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  revokeText: { color: colors.coral, fontSize: fontSize.xs, fontWeight: '600' },
})
