import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildCSV } from '@/lib/finance'

function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = fileName
  anchor.click()

  URL.revokeObjectURL(url)
}

export function ExportActions({ transactions }) {
  function exportCSV() {
    const csv = buildCSV(transactions)
    downloadFile(csv, 'transactions.csv', 'text/csv;charset=utf-8;')
  }

  function exportJSON() {
    downloadFile(JSON.stringify(transactions, null, 2), 'transactions.json', 'application/json;charset=utf-8;')
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={exportCSV}>
        <Download size={14} /> Export CSV
      </Button>
      <Button variant="secondary" size="sm" onClick={exportJSON}>
        <Download size={14} /> Export JSON
      </Button>
    </div>
  )
}
