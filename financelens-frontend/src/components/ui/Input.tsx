import type { InputHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/format'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

export function Input({ label, error, icon, className, id, ...rest }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm text-paper-dim">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-paper-faint">{icon}</span>}
        <input
          id={inputId}
          className={cx(
            'w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2.5 text-sm text-paper placeholder:text-paper-faint',
            'focus:border-signal focus:outline-none transition-colors',
            !!icon && 'pl-9',
            error && 'border-coral',
            className
          )}
          {...rest}
        />
      </div>
      {error && <span className="text-xs text-coral">{error}</span>}
    </div>
  )
}
