import { cn } from '@/lib/utils'

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'h-10 w-full rounded-xl border bg-white/70 px-3 text-sm outline-none transition focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] dark:bg-[hsl(var(--card))]',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
