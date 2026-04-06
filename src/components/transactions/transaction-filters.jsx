import { CalendarDays, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

function toLocalISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseFilterDate(value) {
  return value ? new Date(`${value}T00:00:00`) : undefined
}

function formatDisplayDate(value) {
  if (!value) {
    return 'Select date'
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function DateFilterPicker({ label, value, onChange }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="secondary" className="h-10 w-full justify-between">
          <span className="inline-flex items-center gap-2 text-sm">
            <CalendarDays size={14} />
            {value ? formatDisplayDate(value) : label}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Calendar
          mode="single"
          selected={parseFilterDate(value)}
          onSelect={(date) => onChange(date ? toLocalISODate(date) : '')}
          initialFocus
        />
        <div className="flex justify-end border-t p-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange('')}>
            <X size={14} /> Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function TransactionFilters({ filters, categories, onChange, onReset }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
      <div className="relative lg:col-span-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={15} />
        <Input
          className="pl-9"
          placeholder="Search description or category"
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
          aria-label="Search transactions"
        />
      </div>

      <DateFilterPicker label="From date" value={filters.dateFrom} onChange={(value) => onChange({ dateFrom: value })} />

      <DateFilterPicker label="To date" value={filters.dateTo} onChange={(value) => onChange({ dateTo: value })} />

      <Select value={filters.type} onChange={(event) => onChange({ type: event.target.value })} aria-label="Filter by transaction type">
        <option value="all">All types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </Select>

      <Select
        value={filters.category}
        onChange={(event) => onChange({ category: event.target.value })}
        aria-label="Filter by category"
      >
        <option value="all">All categories</option>
        {categories.map((category) => (
          <option value={category} key={category}>
            {category}
          </option>
        ))}
      </Select>

      <Button variant="secondary" onClick={onReset}>
        Reset filters
      </Button>
    </div>
  )
}
