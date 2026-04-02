import { cn } from '@/lib/utils'

export function Table({ className, ...props }) {
  return <table className={cn('w-full text-left text-sm', className)} {...props} />
}

export function TableHead({ className, ...props }) {
  return <th className={cn('px-4 py-3 font-semibold text-[hsl(var(--muted-foreground))]', className)} {...props} />
}

export function TableCell({ className, ...props }) {
  return <td className={cn('px-4 py-3 align-middle', className)} {...props} />
}

export function TableRow({ className, ...props }) {
  return <tr className={cn('border-b last:border-b-0', className)} {...props} />
}
