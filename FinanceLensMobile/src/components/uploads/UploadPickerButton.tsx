import React, { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { pick, types, errorCodes, isErrorWithCode } from '@react-native-documents/picker'
import type { Account } from '../../types'
import { uploadsApi, type PickedFile } from '../../api/uploads'
import { getErrorMessage } from '../../api/client'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { colors, spacing, fontSize } from '../../theme'

export function UploadPickerButton({
  accounts,
  onUploaded,
}: {
  accounts: Account[]
  onUploaded: () => void
}) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handlePick() {
    if (!accountId) {
      setError('Add an account first.')
      return
    }
    setError('')
    try {
      const [res] = await pick({ type: [types.pdf] })
      const file: PickedFile = {
        uri: res.uri,
        name: res.name ?? 'statement.pdf',
        type: res.type ?? 'application/pdf',
      }
      setUploading(true)
      await uploadsApi.upload(accountId, file)
      onUploaded()
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return
      setError(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  return (
    <View style={styles.wrap}>
      <Select
        label="Account"
        value={accountId}
        onChange={setAccountId}
        options={accounts.map((a) => ({ label: a.name, value: a.id }))}
      />
      <Button
        title={uploading ? 'Uploading…' : 'Upload a statement PDF'}
        onPress={handlePick}
        loading={uploading}
        fullWidth
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.hint}>PhonePe, GPay, Paytm, or bank statement PDFs are supported.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  error: { color: colors.coral, fontSize: fontSize.sm },
  hint: { color: colors.paperFaint, fontSize: fontSize.xs, textAlign: 'center' },
})
