import React from 'react'
import type { UploadStatus } from '../../types'
import { Badge } from '../ui/Primitives'

const toneByStatus: Record<UploadStatus, 'neutral' | 'signal' | 'amber' | 'coral'> = {
  queued: 'neutral',
  parsing: 'amber',
  categorizing: 'amber',
  completed: 'signal',
  failed: 'coral',
}

const labelByStatus: Record<UploadStatus, string> = {
  queued: 'Queued',
  parsing: 'Parsing',
  categorizing: 'Categorizing',
  completed: 'Completed',
  failed: 'Failed',
}

export function UploadStatusBadge({ status }: { status: UploadStatus }) {
  return <Badge tone={toneByStatus[status]}>{labelByStatus[status]}</Badge>
}
