import { Outlet, Link } from 'react-router-dom'
import { Square } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useCaptureStore } from '../../store/captureStore'

export function AppShell() {
  const mode = useCaptureStore((s) => s.mode)
  const deviceName = useCaptureStore((s) => s.device?.device_name)
  const imported = useCaptureStore((s) => s.counts.ok)
  const stop = useCaptureStore((s) => s.stop)

  return (
    <div className="flex min-h-screen bg-ink-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {mode !== 'idle' && (
          <div className="flex items-center justify-between gap-4 border-b border-signal/30 bg-signal/10 px-8 py-2 text-xs text-signal">
            <span>
              {mode === 'live' ? 'Live capture running' : 'Sending burst'} from {deviceName} · {imported} captured ·{' '}
              <Link to="/devices" className="underline">
                details
              </Link>
            </span>
            <button onClick={stop} className="inline-flex items-center gap-1.5 hover:text-paper">
              <Square className="h-3 w-3" /> Stop
            </button>
          </div>
        )}
        <div className="mx-auto max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
