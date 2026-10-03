import { Pencil, Trash2, Smartphone, FileText, Edit3 } from 'lucide-react'
import type { Transaction } from '../../types'
import { formatCurrency, formatDate } from '../../lib/format'
import { Badge } from '../ui/Primitives'

const sourceIcon = {
  pdf_upload: FileText,
  device_capture: Smartphone,
  manual: Edit3,
}

const sourceLabel = {
  pdf_upload: 'PDF statement',
  device_capture: 'Device capture',
  manual: 'Manual entry',
}

export function TransactionRow({
  txn,
  isAdmin,
  onEdit,
  onDelete,
}: {
  txn: Transaction
  isAdmin: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const SourceIcon = sourceIcon[txn.source]
  const isCredit = txn.type === 'credit'

  return (
    <tr className="border-b border-ink-800 last:border-0 hover:bg-ink-850/50 transition-colors group">
      <td className="py-3 pl-4 pr-2">
        <div className="flex items-center gap-2 text-paper-faint" title={sourceLabel[txn.source]}>
          <SourceIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </div>
      </td>
      <td className="py-3 px-2">
        <p className="text-sm text-paper">{txn.merchant_normalized || txn.merchant_raw}</p>
        {txn.description && <p className="text-xs text-paper-faint mt-0.5">{txn.description}</p>}
      </td>
      <td className="py-3 px-2">
        {txn.category ? (
          <Badge>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: txn.category.color }} />
              {txn.category.name}
            </span>
          </Badge>
        ) : (
          <span className="text-xs text-paper-faint">Uncategorized</span>
        )}
      </td>
      <td className="py-3 px-2 text-sm text-paper-dim whitespace-nowrap">{formatDate(txn.txn_timestamp)}</td>
      <td className="py-3 px-2 text-right">
        <span className={`text-sm tabular font-medium ${isCredit ? 'text-signal' : 'text-paper'}`}>
          {isCredit ? '+' : '-'}
          {formatCurrency(txn.amount)}
        </span>
      </td>
      {isAdmin && (
        <td className="py-3 pl-2 pr-4">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="p-1.5 rounded text-paper-faint hover:text-paper hover:bg-ink-800">
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded text-paper-faint hover:text-coral hover:bg-coral/10">
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </td>
      )}
    </tr>
  )
}
