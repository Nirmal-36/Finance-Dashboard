import { Search, Download } from 'lucide-react'
import type { Category, TransactionFilters as Filters } from '../../types'
import { Input } from '../ui/Input'
import { Select } from '../ui/Primitives'
import { Button } from '../ui/Button'
import { transactionsApi } from '../../api/transactions'

export function TransactionFiltersBar({
  filters,
  onChange,
  categories,
}: {
  filters: Filters
  onChange: (f: Filters) => void
  categories: Category[]
}) {
  function update(patch: Partial<Filters>) {
    onChange({ ...filters, ...patch, page: 1 })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="flex-1 min-w-[200px]">
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Search merchant or description..."
          value={filters.search ?? ''}
          onChange={(e) => update({ search: e.target.value || undefined })}
        />
      </div>

      <Select value={filters.type ?? ''} onChange={(e) => update({ type: (e.target.value || undefined) as Filters['type'] })}>
        <option value="">All types</option>
        <option value="debit">Debit</option>
        <option value="credit">Credit</option>
      </Select>

      <Select
        value={filters.category_id ?? ''}
        onChange={(e) => update({ category_id: e.target.value || undefined })}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <input
        type="date"
        value={filters.date_from ?? ''}
        onChange={(e) => update({ date_from: e.target.value || undefined })}
        className="rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-paper-dim focus:border-signal focus:outline-none"
      />
      <span className="text-paper-faint text-sm">to</span>
      <input
        type="date"
        value={filters.date_to ?? ''}
        onChange={(e) => update({ date_to: e.target.value || undefined })}
        className="rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-paper-dim focus:border-signal focus:outline-none"
      />

      <div className="flex gap-1 ml-auto">
        <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={() => transactionsApi.export('csv')}>
          CSV
        </Button>
        <Button variant="secondary" size="sm" icon={<Download className="h-3.5 w-3.5" />} onClick={() => transactionsApi.export('json')}>
          JSON
        </Button>
      </div>
    </div>
  )
}
