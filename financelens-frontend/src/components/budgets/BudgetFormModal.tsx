import { useState, type FormEvent } from 'react'
import type { Category } from '../../types'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Primitives'
import { Button } from '../ui/Button'
import { budgetsApi } from '../../api/dashboard'
import { getErrorMessage } from '../../api/client'
import { monthName } from '../../lib/format'

export function BudgetFormModal({
  open,
  onClose,
  onSaved,
  categories,
  year,
  month,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  categories: Category[]
  year: number
  month: number
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await budgetsApi.create({ category_id: categoryId, year, month, limit_amount: parseFloat(amount) })
      onSaved()
      onClose()
      setAmount('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Set budget for ${monthName(month)}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-paper-dim">Category</label>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full" required>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <Input
          label="Monthly limit"
          type="number"
          step="1"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 8000"
          required
        />
        {error && <p className="text-sm text-coral">{error}</p>}
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Set budget
          </Button>
        </div>
      </form>
    </Modal>
  )
}
