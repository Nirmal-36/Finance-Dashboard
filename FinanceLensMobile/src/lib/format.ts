export function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.abs(num))
}

export function formatCompactCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (Math.abs(num) >= 100000) return `₹${(num / 100000).toFixed(1)}L`
  if (Math.abs(num) >= 1000) return `₹${(num / 1000).toFixed(1)}K`
  return formatCurrency(num)
}

export function formatDate(iso: string, opts?: { withTime?: boolean }): string {
  const d = new Date(iso)
  const dateStr = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  if (opts?.withTime) {
    const timeStr = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    return `${dateStr}, ${timeStr}`
  }
  return dateStr
}

export function formatRelativeDate(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const diffDays = Math.round((d.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`
  return formatDate(iso)
}

export function monthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })
}
