import { useEffect, useState } from 'react'
import { Plus, Smartphone, Trash2 } from 'lucide-react'
import { devicesApi } from '../api/uploads'
import type { Device } from '../types'
import { PageHeader, Card, Spinner, EmptyState, Badge } from '../components/ui/Primitives'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { DeviceKeyModal } from '../components/devices/DeviceKeyModal'
import { formatDate } from '../lib/format'
import { getErrorMessage } from '../api/client'

export function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [deviceName, setDeviceName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [newKey, setNewKey] = useState<{ name: string; key: string } | null>(null)

  function load() {
    setLoading(true)
    devicesApi
      .list()
      .then(setDevices)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await devicesApi.register(deviceName)
      setRegisterOpen(false)
      setDeviceName('')
      setNewKey({ name: res.device_name, key: res.api_key })
      load()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this device? It will no longer be able to send transactions.')) return
    await devicesApi.revoke(id)
    load()
  }

  return (
    <div>
      <PageHeader
        title="Devices"
        subtitle="Manage phones running the FinanceLens companion app"
        action={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setRegisterOpen(true)}>
            Register device
          </Button>
        }
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : devices.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={<Smartphone className="h-8 w-8" strokeWidth={1.5} />}
            title="No devices registered"
            description="Register a device to get an API key for the Android companion app, which captures transactions live as they happen."
            action={
              <Button icon={<Plus className="h-4 w-4" />} onClick={() => setRegisterOpen(true)}>
                Register your first device
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="px-6">
          {devices.map((d) => (
            <div key={d.id} className="flex items-center justify-between py-4 border-b border-ink-800 last:border-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-800 text-paper-dim">
                  <Smartphone className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm text-paper">{d.device_name}</p>
                  <p className="text-xs text-paper-faint">
                    {d.last_seen_at ? `Last seen ${formatDate(d.last_seen_at, { withTime: true })}` : 'Never used'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={d.is_active ? 'signal' : 'neutral'}>{d.is_active ? 'Active' : 'Revoked'}</Badge>
                {d.is_active && (
                  <button
                    onClick={() => handleRevoke(d.id)}
                    className="p-1.5 rounded text-paper-faint hover:text-coral hover:bg-coral/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      <Modal open={registerOpen} onClose={() => setRegisterOpen(false)} title="Register a device">
        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label="Device name"
            placeholder="e.g. Anas's Pixel 8"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            required
          />
          {error && <p className="text-sm text-coral">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setRegisterOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Register
            </Button>
          </div>
        </form>
      </Modal>

      {newKey && (
        <DeviceKeyModal
          open={!!newKey}
          onClose={() => setNewKey(null)}
          deviceName={newKey.name}
          apiKey={newKey.key}
        />
      )}
    </div>
  )
}
