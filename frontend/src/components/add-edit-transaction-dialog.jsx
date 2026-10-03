import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

const initialForm = {
  date: '',
  description: '',
  amount: '',
  category: '',
  type: 'expense',
  recurring: false,
}

function getInitialForm(transaction) {
  if (!transaction) {
    return { ...initialForm, date: new Date().toISOString().slice(0, 10) }
  }

  return {
    date: transaction.date,
    description: transaction.description,
    amount: String(transaction.amount),
    category: transaction.category,
    type: transaction.type,
    recurring: Boolean(transaction.recurring),
  }
}

export function AddEditTransactionDialog({ mode, transaction, categories, onClose, onSubmit }) {
  const [form, setForm] = useState(() => getInitialForm(transaction))
  const [error, setError] = useState('')

  const title = useMemo(() => (mode === 'edit' ? 'Edit transaction' : 'Add transaction'), [mode])

  function handleSubmit(event) {
    event.preventDefault()

    if (!form.date || !form.description || !form.amount || !form.category || !form.type) {
      setError('Please complete all fields.')
      return
    }

    const amount = Number(form.amount)

    if (Number.isNaN(amount) || amount <= 0) {
      setError('Amount must be a positive number.')
      return
    }

    onSubmit({
      date: form.date,
      description: form.description.trim(),
      amount,
      category: form.category,
      type: form.type,
      recurring: form.recurring,
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4 rounded-2xl border bg-[hsl(var(--card))] p-6 shadow-2xl">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{mode === 'edit' ? 'Update transaction details.' : 'Create a new transaction entry.'}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="date">
              Date
            </label>
            <Input id="date" type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="amount">
              Amount
            </label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="description">
            Description
          </label>
          <Input
            id="description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Ex: Grocery run"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="type">
              Type
            </label>
            <Select id="type" value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="category">
              Category
            </label>
            <Select
              id="category"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            >
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={form.recurring}
            onChange={(event) => setForm((prev) => ({ ...prev, recurring: event.target.checked }))}
          />
          Mark this transaction as recurring (monthly)
        </label>

        {error ? <p className="text-sm font-medium text-[hsl(var(--danger))]">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{mode === 'edit' ? 'Save changes' : 'Add transaction'}</Button>
        </div>
      </form>
    </div>
  )
}
