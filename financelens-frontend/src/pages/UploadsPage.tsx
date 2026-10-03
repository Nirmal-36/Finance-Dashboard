import { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, AlertCircle } from 'lucide-react'
import { uploadsApi } from '../api/uploads'
import { accountsApi } from '../api/accounts'
import type { Account, StatementUpload } from '../types'
import { PageHeader, Card, Spinner, EmptyState } from '../components/ui/Primitives'
import { UploadDropzone } from '../components/uploads/UploadDropzone'
import { UploadStatusBadge } from '../components/uploads/UploadStatusBadge'
import { formatDate } from '../lib/format'
import { getErrorMessage } from '../api/client'

const ACTIVE_STATUSES = new Set(['queued', 'parsing', 'categorizing'])

export function UploadsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountId, setAccountId] = useState('')
  const [uploads, setUploads] = useState<StatementUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadUploads = useCallback(() => {
    uploadsApi.list().then(setUploads)
  }, [])

  useEffect(() => {
    accountsApi.list().then((accs) => {
      setAccounts(accs)
      if (accs[0]) setAccountId(accs[0].id)
    })
    uploadsApi
      .list()
      .then(setUploads)
      .finally(() => setLoading(false))
  }, [])

  // Poll while any upload is still in an active (non-terminal) state.
  useEffect(() => {
    const hasActive = uploads.some((u) => ACTIVE_STATUSES.has(u.status))
    if (hasActive && !pollRef.current) {
      pollRef.current = setInterval(loadUploads, 2000)
    } else if (!hasActive && pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [uploads, loadUploads])

  async function handleFile(file: File) {
    if (!accountId) {
      setError('Add an account first before uploading a statement.')
      return
    }
    setError('')
    setUploading(true)
    try {
      await uploadsApi.upload(accountId, file)
      loadUploads()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Statements" subtitle="Upload a PhonePe PDF statement to import transactions" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="p-6 lg:col-span-2 h-fit">
          {accounts.length === 0 && !loading ? (
            <EmptyState
              title="No accounts yet"
              description="Create an account first — PhonePe, GPay, or a bank — before uploading a statement."
            />
          ) : (
            <>
              <UploadDropzone
                accounts={accounts}
                accountId={accountId}
                onAccountChange={setAccountId}
                onFile={handleFile}
                uploading={uploading}
              />
              {error && (
                <p className="flex items-center gap-1.5 text-sm text-coral mt-3">
                  <AlertCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {error}
                </p>
              )}
            </>
          )}
        </Card>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Spinner />
            </div>
          ) : uploads.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                icon={<FileText className="h-8 w-8" strokeWidth={1.5} />}
                title="No statements uploaded yet"
                description="Once you upload one, its parsing progress will show here."
              />
            </Card>
          ) : (
            <Card className="px-6">
              {uploads.map((u) => (
                <div key={u.id} className="py-4 border-b border-ink-800 last:border-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-paper truncate">{u.original_filename}</p>
                      <p className="text-xs text-paper-faint mt-0.5">{formatDate(u.created_at, { withTime: true })}</p>
                    </div>
                    <UploadStatusBadge status={u.status} />
                  </div>

                  {u.status === 'completed' && (
                    <p className="text-xs text-paper-dim mt-2">
                      {u.transactions_imported} imported
                      {u.transactions_skipped_duplicate > 0 && `, ${u.transactions_skipped_duplicate} duplicates skipped`}
                      {' '}of {u.transactions_found} found
                    </p>
                  )}
                  {u.status === 'failed' && u.error_message && (
                    <p className="text-xs text-coral mt-2">{u.error_message}</p>
                  )}
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
