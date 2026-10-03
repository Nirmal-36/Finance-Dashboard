import { useState } from 'react'
import { Copy, Check, AlertTriangle } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

export function DeviceKeyModal({
  open,
  onClose,
  deviceName,
  apiKey,
}: {
  open: boolean
  onClose: () => void
  deviceName: string
  apiKey: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal open={open} onClose={onClose} title={`${deviceName} registered`}>
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-md bg-amber/10 border border-amber/30 px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 text-amber shrink-0 mt-0.5" strokeWidth={1.75} />
          <p className="text-xs text-amber">
            This key is shown only once. Copy it into the companion app's secure storage now —
            it cannot be retrieved again after you close this.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-md border border-ink-700 bg-ink-950 px-3 py-2.5 text-xs text-paper font-mono">
            {apiKey}
          </code>
          <Button variant="secondary" size="sm" onClick={handleCopy} icon={copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}>
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </Modal>
  )
}
