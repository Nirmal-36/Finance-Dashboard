import { useCallback, useEffect, useState } from 'react'
import { useCaptureStore } from '../store/captureStore'
import { useSearchParams } from 'react-router-dom'
import { Plus, Receipt, ArrowUpDown } from 'lucide-react'
import { transactionsApi } from '../api/transactions'
import { accountsApi, categoriesApi } from '../api/accounts'
import type { Account, Category, PaginatedTransactions, Transaction, TransactionFilters } from '../types'
import { useAuthStore } from '../store/authStore'
import { PageHeader, Spinner, EmptyState } from '../components/ui/Primitives'
import { Button } from '../components/ui/Button'
import { Pagination } from '../components/ui/Pagination'
import { TransactionFiltersBar } from '../components/transactions/TransactionFilters'
import { TransactionRow } from '../components/transactions/TransactionRow'
import { TransactionFormModal } from '../components/transactions/TransactionFormModal'

export function TransactionsPage() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const [searchParams] = useSearchParams()

  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    page_size: 25,
    sort_by: 'txn_timestamp',
    sort_order: 'desc',
    category_id: searchParams.get('category_id') || undefined,
  })

  const [data, setData] = useState<PaginatedTransactions | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)

  const dataVersion = useCaptureStore((s) => s.dataVersion)

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    transactionsApi
      .list(filters)
      .then(setData)
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => {
    load(dataVersion > 0)
  }, [load, dataVersion])

  useEffect(() => {
    accountsApi.list().then(setAccounts)
    categoriesApi.list().then(setCategories)
  }, [])

  function toggleSort() {
    setFilters((f) => ({ ...f, sort_order: f.sort_order === 'desc' ? 'asc' : 'desc' }))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this transaction? This cannot be undone.')) return
    await transactionsApi.remove(id)
    load()
  }

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Search, filter, and manage every transaction"
        action={
          isAdmin && (
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditing(null)
                setModalOpen(true)
              }}
            >
              Add transaction
            </Button>
          )
        }
      />

      <TransactionFiltersBar filters={filters} onChange={setFilters} categories={categories} />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-8 w-8" strokeWidth={1.5} />}
          title="No transactions found"
          description="Try adjusting your filters, or add a transaction manually."
        />
      ) : (
        <div className="rounded-[var(--radius-card)] border border-ink-800 bg-ink-900 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink-800 text-left">
                <th className="py-2.5 pl-4 pr-2 w-8"></th>
                <th className="py-2.5 px-2 text-xs font-medium text-paper-faint">Merchant</th>
                <th className="py-2.5 px-2 text-xs font-medium text-paper-faint">Category</th>
                <th className="py-2.5 px-2 text-xs font-medium text-paper-faint">
                  <button onClick={toggleSort} className="inline-flex items-center gap-1 hover:text-paper-dim">
                    Date <ArrowUpDown className="h-3 w-3" strokeWidth={1.75} />
                  </button>
                </th>
                <th className="py-2.5 px-2 text-xs font-medium text-paper-faint text-right">Amount</th>
                {isAdmin && <th className="py-2.5 pl-2 pr-4"></th>}
              </tr>
            </thead>
            <tbody>
              {data.items.map((txn) => (
                <TransactionRow
                  key={txn.id}
                  txn={txn}
                  isAdmin={isAdmin}
                  onEdit={() => {
                    setEditing(txn)
                    setModalOpen(true)
                  }}
                  onDelete={() => handleDelete(txn.id)}
                />
              ))}
            </tbody>
          </table>
          <div className="px-4">
            <Pagination
              page={data.page}
              totalPages={data.total_pages}
              total={data.total}
              onChange={(page) => setFilters((f) => ({ ...f, page }))}
            />
          </div>
        </div>
      )}

      <TransactionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => load()}
        accounts={accounts}
        categories={categories}
        editing={editing}
      />
    </div>
  )
}
