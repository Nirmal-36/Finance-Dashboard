import { useEffect, useState, type FormEvent } from 'react'
import type { Account, Category, Transaction, TransactionType } from '../../types'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Primitives'
import { Button } from '../ui/Button'
import { transactionsApi } from '../../api/transactions'
import { getErrorMessage } from '../../api/client'

export function TransactionFormModal({
  open,
  onClose,
  onSaved,
  accounts,
  categories,
  editing,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  accounts: Account[]
  categories: Category[]
  editing: Transaction | null
}) {
  const [accountId, setAccountId] = useState(editing?.account_id ?? accounts[0]?.id ?? '')
  const [categoryId, setCategoryId] = useState(editing?.category?.id ?? '')
  const [amount, setAmount] = useState(editing?.amount ?? '')
  const [type, setType] = useState<TransactionType>(editing?.type ?? 'debit')
  const [merchant, setMerchant] = useState(editing?.merchant_raw ?? '')
  const [description, setDescription] = useState(editing?.description ?? '')
  const [timestamp, setTimestamp] = useState(
    editing ? editing.txn_timestamp.slice(0, 16) : new Date().toISOString().slice(0, 16)
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // The modal mounts once and toggles via `open`, so state set at the
  // initial useState() call can go stale — in particular, `accounts` is
  // still [] on first mount (it loads async in the parent), which locked
  // accountId at '' and caused every create-transaction request to send
  // an empty account_id. Re-sync whenever the modal opens with accounts
  // that have since loaded.
  useEffect(() => {
    if (open && !editing && !accountId && accounts[0]) {
      setAccountId(accounts[0].id)
    }
  }, [open, editing, accounts, accountId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!editing && !accountId) {
      setError('Select an account before adding a transaction.')
      return
    }

    setLoading(true)
    try {
      if (editing) {
        await transactionsApi.update(editing.id, {
          category_id: categoryId || undefined,
          description: description || undefined,
          amount: parseFloat(amount),
        })
      } else {
        await transactionsApi.create({
          account_id: accountId,
          category_id: categoryId || undefined,
          amount: parseFloat(amount),
          type,
          txn_timestamp: new Date(timestamp).toISOString(),
          merchant_raw: merchant,
          description: description || undefined,
        })
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit transaction' : 'Add transaction'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!editing && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-paper-dim">Account</label>
              <Select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                disabled={accounts.length === 0}
                className="w-full"
              >
                {accounts.length === 0 ? (
                  <option value="">No accounts yet — add one first</option>
                ) : (
                  accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))
                )}
              </Select>
            </div>
            <Input
              label="Merchant"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Swiggy"
              required
            />
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          {!editing && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-paper-dim">Type</label>
              <Select value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </Select>
            </div>
          )}
        </div>

        {!editing && (
          <Input
            label="Date & time"
            type="datetime-local"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            required
          />
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-paper-dim">Category</label>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {error && <p className="text-sm text-coral">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            {editing ? 'Save changes' : 'Add transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
