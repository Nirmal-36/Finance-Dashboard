import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export function TransactionFilters({ filters, categories, onChange, onReset }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="relative lg:col-span-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={15} />
        <Input
          className="pl-9"
          placeholder="Search by description"
          value={filters.search}
          onChange={(event) => onChange({ search: event.target.value })}
          aria-label="Search transactions"
        />
      </div>

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
