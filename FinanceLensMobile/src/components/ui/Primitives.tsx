import React from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { colors, radius, spacing, fontSize } from '../../theme'

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'signal' | 'amber' | 'coral'
}) {
  return (
    <View style={[styles.badge, badgeTones[tone]]}>
      <Text style={[styles.badgeText, badgeTextTones[tone]]}>{children}</Text>
    </View>
  )
}

export function Spinner({ size = 'large' }: { size?: 'small' | 'large' }) {
  return (
    <View style={styles.spinnerWrap}>
      <ActivityIndicator size={size} color={colors.signal} />
    </View>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <View style={styles.emptyWrap}>
      {icon}
      <Text style={styles.emptyTitle}>{title}</Text>
      {description && <Text style={styles.emptyDesc}>{description}</Text>}
      {action}
    </View>
  )
}

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.headerWrap}>
      <Text style={styles.headerTitle}>{title}</Text>
      {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.ink900,
    borderWidth: 1,
    borderColor: colors.ink800,
    borderRadius: radius.lg,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: '600' },
  spinnerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl * 2 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl, gap: spacing.sm },
  emptyTitle: { color: colors.paper, fontSize: fontSize.base, fontWeight: '600', textAlign: 'center' },
  emptyDesc: { color: colors.paperDim, fontSize: fontSize.sm, textAlign: 'center' },
  headerWrap: { marginBottom: spacing.lg },
  headerTitle: { color: colors.paper, fontSize: fontSize.xxl, fontWeight: '700' },
  headerSubtitle: { color: colors.paperDim, fontSize: fontSize.sm, marginTop: 2 },
})

const badgeTones = StyleSheet.create({
  neutral: { backgroundColor: colors.ink800 },
  signal: { backgroundColor: 'rgba(124,154,146,0.15)' },
  amber: { backgroundColor: 'rgba(212,162,76,0.15)' },
  coral: { backgroundColor: 'rgba(224,98,76,0.15)' },
})

const badgeTextTones = StyleSheet.create({
  neutral: { color: colors.paperDim },
  signal: { color: colors.signal },
  amber: { color: colors.amber },
  coral: { color: colors.coral },
})
