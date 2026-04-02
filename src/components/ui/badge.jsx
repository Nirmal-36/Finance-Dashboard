import { cn } from '@/lib/utils'

export function Badge({ className, tone = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        tone === 'income' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
        tone === 'expense' && 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
        tone === 'default' && 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300',
        className,
      )}
      {...props}
    />
  )
}
