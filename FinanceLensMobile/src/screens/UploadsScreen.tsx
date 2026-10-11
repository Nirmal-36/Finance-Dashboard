import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { uploadsApi } from '../api/uploads'
import { accountsApi } from '../api/accounts'
import type { Account, StatementUpload } from '../types'
import { useAuthStore } from '../store/authStore'
import { ScreenHeader, Spinner, EmptyState, Card } from '../components/ui/Primitives'
import { UploadRow } from '../components/uploads/UploadRow'
import { UploadPickerButton } from '../components/uploads/UploadPickerButton'
import { colors, spacing } from '../theme'

const POLL_INTERVAL_MS = 4000

function isInProgress(u: StatementUpload) {
  return u.status === 'queued' || u.status === 'parsing' || u.status === 'categorizing'
}

export function UploadsScreen() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const [uploads, setUploads] = useState<StatementUpload[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(() => {
    return uploadsApi.list().then(setUploads)
  }, [])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      Promise.all([load(), accountsApi.list().then(setAccounts)]).finally(() => setLoading(false))

      return () => {
        if (pollRef.current) clearInterval(pollRef.current)
      }
    }, [load])
  )

  // Poll while anything is still processing, so status badges move from
  // "Parsing" to "Completed"/"Failed" without the user manually refreshing.
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (uploads.some(isInProgress)) {
      pollRef.current = setInterval(() => {
        load()
      }, POLL_INTERVAL_MS)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [uploads, load])

  return (
    <View style={styles.flex}>
      <View style={styles.headerWrap}>
        <ScreenHeader title="Statements" subtitle="Upload bank or wallet PDFs" />
      </View>

      {loading ? (
        <Spinner />
      ) : (
        <FlatList
          data={uploads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UploadRow upload={item} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            isAdmin ? (
              <Card style={styles.pickerCard}>
                <UploadPickerButton accounts={accounts} onUploaded={load} />
              </Card>
            ) : undefined
          }
          ListEmptyComponent={
            <EmptyState
              title="No statements uploaded yet"
              description={isAdmin ? 'Upload a PDF above to import transactions.' : 'Ask an admin to upload a statement.'}
            />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ink950 },
  headerWrap: { padding: spacing.lg, paddingBottom: spacing.sm },
  listContent: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  pickerCard: { padding: spacing.lg, marginBottom: spacing.lg },
})
