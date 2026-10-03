import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/format'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  icon?: ReactNode
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap'

  const variants = {
    primary: 'bg-signal text-ink-950 hover:bg-signal-dim',
    secondary: 'bg-ink-800 text-paper hover:bg-ink-700 border border-ink-700',
    ghost: 'text-paper-dim hover:text-paper hover:bg-ink-850',
    danger: 'bg-coral/10 text-coral hover:bg-coral/20 border border-coral/30',
  }

  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2.5',
  }

  return (
    <button
      className={cx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  )
}
