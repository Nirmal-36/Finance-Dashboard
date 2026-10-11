import { useEffect, useState } from 'react'
import { Play, Square, Unplug, Zap } from 'lucide-react'
import { accountsApi } from '../../api/accounts'
import { useCaptureStore } from '../../store/captureStore'
import type { Account } from '../../types'
import { Badge, Card, Select } from '../ui/Primitives'
import { Button } from '../ui/Button'

const BURST_SIZES = [20, 60, 120]

// Controls for the simulated capture run. The run itself lives in
// captureStore, so it keeps going when you leave this page.
export function CaptureSimulator() {
  const { device, mode, counts, log, error, start, stop, disconnect } = useCaptureStore()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountId, setAccountId] = useState('')
  const [burstSize, setBurstSize] = useState(60)

  useEffect(() => {
    accountsApi.list().then((list) => {
      setAccounts(list)
      setAccountId((cur) => cur || list[0]?.id || '')
    })
  }, [])

  if (!device) return null

  const running = mode !== 'idle'

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-signal/15 text-signal">
            <Zap className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm text-paper">
              Connected to {device.device_name} {mode === 'live' && <Badge tone="signal">Live</Badge>}
            </p>
            <p className="text-xs text-paper-faint">Simulating the phone's capture service from this browser</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<Unplug className="h-3.5 w-3.5" />}
          onClick={disconnect}
        >
          Disconnect
        </Button>
      </div>

      {accounts.length === 0 ? (
        <p className="mt-4 text-sm text-paper-dim">Create an account on the Overview page first, then come back.</p>
      ) : (
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5 text-sm text-paper-dim">
            Account
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)} disabled={running}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-paper-dim">
            Burst size
            <Select value={burstSize} onChange={(e) => setBurstSize(Number(e.target.value))} disabled={running}>
              {BURST_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n} transactions
                </option>
              ))}
            </Select>
          </label>
          <Button variant="secondary" disabled={running || !accountId} onClick={() => start('burst', accountId, burstSize)}>
            Send burst
          </Button>
          {mode === 'live' ? (
            <Button variant="danger" icon={<Square className="h-3.5 w-3.5" />} onClick={stop}>
              Stop live feed
            </Button>
          ) : (
            <Button icon={<Play className="h-3.5 w-3.5" />} disabled={running || !accountId} onClick={() => start('live', accountId, burstSize)}>
              Start live feed
            </Button>
          )}
        </div>
      )}

      {(running || counts.ok + counts.duplicate + counts.error > 0) && (
        <div className="mt-5 border-t border-ink-800 pt-4">
          <p className="text-xs text-paper-dim">
            {mode === 'burst' ? 'Sending burst… ' : mode === 'live' ? 'Live feed running… ' : ''}
            {counts.ok} captured · {counts.duplicate} deduped · {counts.error} failed
          </p>
          {error && <p className="mt-1 text-xs text-coral">{error}</p>}
          <ul className="mt-2 space-y-0.5 font-mono text-xs text-paper-faint">
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
