import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { devicesApi } from '../../api/uploads'
import { getErrorMessage } from '../../api/client'
import type { DeviceRegisterResponse } from '../../types'

export function ConnectDeviceModal({
  open,
  onClose,
  onConnected,
}: {
  open: boolean
  onClose: () => void
  onConnected: (device: DeviceRegisterResponse) => void
}) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setCode('')
      setError('')
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      onConnected(await devicesApi.pair(code))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Connect with a pairing code">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-paper-dim">
          In the FinanceLens mobile app, open Settings → Manage devices → <em>Get pairing code</em>, then type the
          6-digit code here. Codes work once and expire after 3 minutes.
        </p>
        <input
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          aria-label="Pairing code"
          className="w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-4 text-center font-mono text-3xl tracking-[0.5em] text-paper placeholder:text-ink-600 focus:border-signal focus:outline-none"
        />
        {error && <p className="text-sm text-coral">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={code.length !== 6}>
            Connect
          </Button>
        </div>
      </form>
    </Modal>
  )
}
