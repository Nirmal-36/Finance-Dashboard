import type { UploadStatus } from '../../types'
import { Badge } from '../ui/Primitives'

const statusConfig: Record<UploadStatus, { label: string; tone: 'neutral' | 'signal' | 'amber' | 'coral' }> = {
  queued: { label: 'Queued', tone: 'neutral' },
  parsing: { label: 'Parsing…', tone: 'amber' },
  categorizing: { label: 'Categorizing…', tone: 'amber' },
  completed: { label: 'Completed', tone: 'signal' },
  failed: { label: 'Failed', tone: 'coral' },
}

export function UploadStatusBadge({ status }: { status: UploadStatus }) {
  const config = statusConfig[status]
  return <Badge tone={config.tone}>{config.label}</Badge>
}
