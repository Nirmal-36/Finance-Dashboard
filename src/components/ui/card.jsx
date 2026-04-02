import { cn } from '@/lib/utils'

export function Card({ className, ...props }) {
  return (
    <section
      className={cn('rounded-2xl border bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-sm', className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }) {
  return <header className={cn('p-5 pb-2', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('text-sm font-semibold tracking-wide text-[hsl(var(--muted-foreground))]', className)} {...props} />
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-xs text-[hsl(var(--muted-foreground))]', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-5 pt-3', className)} {...props} />
}
