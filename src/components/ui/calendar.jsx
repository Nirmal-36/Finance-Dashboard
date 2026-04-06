import { DayPicker } from 'react-day-picker'
import { cn } from '@/lib/utils'

export function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-2', className)}
      classNames={{
        months: 'flex flex-col gap-2',
        month: 'space-y-3',
        caption: 'flex items-center justify-between px-1 text-sm font-semibold',
        nav: 'flex items-center gap-1',
        button_previous:
          'rounded-md border px-2 py-1 text-xs hover:bg-[hsl(var(--muted))] dark:hover:bg-[hsl(var(--muted))]',
        button_next:
          'rounded-md border px-2 py-1 text-xs hover:bg-[hsl(var(--muted))] dark:hover:bg-[hsl(var(--muted))]',
        month_caption: 'text-sm font-semibold',
        weekdays: 'grid grid-cols-7 gap-1',
        weekday: 'w-8 text-center text-xs text-[hsl(var(--muted-foreground))]',
        week: 'grid grid-cols-7 gap-1',
        day: 'w-8 h-8 p-0 text-sm',
        day_button:
          'grid h-8 w-8 place-items-center rounded-md border border-transparent transition hover:bg-[hsl(var(--muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary)/0.4)]',
        today: 'font-bold text-[hsl(var(--primary))]',
        selected:
          'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--primary-foreground))]',
        outside: 'text-[hsl(var(--muted-foreground)/0.45)]',
        disabled: 'text-[hsl(var(--muted-foreground)/0.45)]',
        hidden: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  )
}
