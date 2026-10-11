import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native'
import { colors, radius, spacing, fontSize } from '../../theme'

interface ButtonProps {
  title: string
  onPress: (e: GestureResponderEvent) => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  loading?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  fullWidth?: boolean
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  icon,
  fullWidth,
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sizeSm : styles.sizeMd,
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'primary' ? colors.ink950 : colors.paper} />
        ) : (
          icon
        )}
        <Text style={[styles.text, textVariantStyles[variant], size === 'sm' && styles.textSm]}>{title}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeMd: {
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
  },
  sizeSm: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  textSm: {
    fontSize: fontSize.sm,
  },
})

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.signal },
  secondary: { backgroundColor: colors.ink800, borderWidth: 1, borderColor: colors.ink700 },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'rgba(224,98,76,0.1)', borderWidth: 1, borderColor: 'rgba(224,98,76,0.3)' },
})

const textVariantStyles = StyleSheet.create({
  primary: { color: colors.ink950 },
  secondary: { color: colors.paper },
  ghost: { color: colors.paperDim },
  danger: { color: colors.coral },
})
