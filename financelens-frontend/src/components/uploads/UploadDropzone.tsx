import { useRef, useState, type DragEvent } from 'react'
import { UploadCloud } from 'lucide-react'
import type { Account } from '../../types'
import { Select } from '../ui/Primitives'
import { cx } from '../../lib/format'

export function UploadDropzone({
  accounts,
  accountId,
  onAccountChange,
  onFile,
  uploading,
}: {
  accounts: Account[]
  accountId: string
  onAccountChange: (id: string) => void
  onFile: (file: File) => void
  uploading: boolean
}) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div>
      <div className="mb-3">
        <label className="text-sm text-paper-dim mb-1.5 block">Account</label>
        <Select value={accountId} onChange={(e) => onAccountChange(e.target.value)} className="w-full">
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cx(
          'flex flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed px-6 py-10 cursor-pointer transition-colors',
          dragOver ? 'border-signal bg-signal/5' : 'border-ink-700 hover:border-ink-600',
          uploading && 'pointer-events-none opacity-60'
        )}
      >
        <UploadCloud className="h-8 w-8 text-paper-faint" strokeWidth={1.5} />
        <p className="text-sm text-paper">
          {uploading ? 'Uploading…' : 'Drop your PhonePe statement PDF here'}
        </p>
        <p className="text-xs text-paper-faint">or click to browse</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFile(file)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
