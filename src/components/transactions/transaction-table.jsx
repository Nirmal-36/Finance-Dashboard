import { ArrowDown, ArrowUp, Pencil, Repeat, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableCell, TableHead, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'

const sortableColumns = [
  { key: 'date', label: 'Date' },
  { key: 'amount', label: 'Amount' },
]

export function TransactionTable({
  transactions,
  filters,
  onSortChange,
  role,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  onPageChange
}) {
  function renderSortIcon(columnKey) {
    if (filters.sortBy !== columnKey) {
      return null
    }

    return filters.sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <p className="font-semibold">No transactions found.</p>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Adjust filters or add your first entry as Admin.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-[hsl(var(--card))]">
      <div className="overflow-x-auto">
        <Table>
          <thead className="bg-[hsl(var(--muted)/0.7)]">
            <TableRow>
              {sortableColumns.map((column) => (
                <TableHead key={column.key}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1"
                    onClick={() =>
                      onSortChange({
                        sortBy: column.key,
                        sortOrder: filters.sortBy === column.key && filters.sortOrder === 'desc' ? 'asc' : 'desc',
                      })
                    }
                  >
                    {column.label}
                    {renderSortIcon(column.key)}
                  </button>
                </TableHead>
              ))}
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              {role === 'admin' ? <TableHead className="text-right">Actions</TableHead> : null}
            </TableRow>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{formatDate(transaction.date)}</TableCell>
                <TableCell className={transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                  {formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1">
                    {transaction.description}
                    {transaction.recurring ? <Repeat size={12} className="text-[hsl(var(--muted-foreground))]" aria-label="Recurring" /> : null}
                  </span>
                </TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell>
                  <Badge tone={transaction.type}>{transaction.type}</Badge>
                </TableCell>
                {role === 'admin' ? (
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(transaction)} aria-label={`Edit ${transaction.description}`}>
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[hsl(var(--danger))]"
                        onClick={() => onDelete(transaction.id)}
                        aria-label={`Delete ${transaction.description}`}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[hsl(var(--muted-foreground))]">
          Showing page {currentPage} of {totalPages} ({totalItems} transactions)
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          <span className="rounded-md border px-2 py-1 text-xs font-medium">Page {currentPage}</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
