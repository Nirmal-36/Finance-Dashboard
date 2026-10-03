import type { ReactNode, SelectHTMLAttributes } from 'react'
import { cx } from '../../lib/format'

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        'rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-paper',
        'focus:border-signal focus:outline-none transition-colors cursor-pointer',
        className
      )}
      {...rest}
    >
      {children}
    </select>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx('rounded-[var(--radius-card)] border border-ink-800 bg-ink-900', className)}>
      {children}
    </div>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'signal' | 'amber' | 'coral'
}) {
  const tones = {
    neutral: 'bg-ink-800 text-paper-dim',
    signal: 'bg-signal/15 text-signal',
    amber: 'bg-amber/15 text-amber',
    coral: 'bg-coral/15 text-coral',
  }
  return (
    <span className={cx('inline-flex items-center rounded px-2 py-0.5 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && <div className="text-paper-faint">{icon}</div>}
      <div className="space-y-1">
        <p className="text-paper font-medium">{title}</p>
        {description && <p className="text-sm text-paper-dim max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        'h-5 w-5 animate-spin rounded-full border-2 border-paper-faint border-t-signal',
        className
      )}
    />
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-2xl text-paper">{title}</h1>
        {subtitle && <p className="text-sm text-paper-dim mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
