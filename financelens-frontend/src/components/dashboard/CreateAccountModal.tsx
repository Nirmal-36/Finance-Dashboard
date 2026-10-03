import { useState, type FormEvent } from 'react'
import type { AccountSource } from '../../types'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Primitives'
import { Button } from '../ui/Button'
import { accountsApi } from '../../api/accounts'
import { getErrorMessage } from '../../api/client'

const sourceOptions: { value: AccountSource; label: string }[] = [
  { value: 'phonepe', label: 'PhonePe' },
  { value: 'gpay', label: 'Google Pay' },
  { value: 'paytm', label: 'Paytm' },
  { value: 'bank', label: 'Bank account' },
  { value: 'manual', label: 'Manual / other' },
]

export function CreateAccountModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [source, setSource] = useState<AccountSource>('phonepe')
  const [balance, setBalance] = useState('0')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await accountsApi.create({ name, source, current_balance: parseFloat(balance) || 0 })
      onCreated()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add your first account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-paper-dim">Source</label>
          <Select value={source} onChange={(e) => setSource(e.target.value as AccountSource)} className="w-full">
            {sourceOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <Input label="Account name" placeholder="e.g. My PhonePe Wallet" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Starting balance" type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} />
        {error && <p className="text-sm text-coral">{error}</p>}
        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Skip for now
          </Button>
          <Button type="submit" loading={loading}>
            Create account
          </Button>
        </div>
      </form>
    </Modal>
  )
}
