import React, { useState } from 'react'
import { View, StyleSheet } from 'react-native'
import type { AccountSource } from '../../types'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { accountsApi } from '../../api/accounts'
import { getErrorMessage } from '../../api/client'
import { spacing } from '../../theme'
import { Text } from 'react-native'
import { colors } from '../../theme'

const sourceOptions = [
  { label: 'PhonePe', value: 'phonepe' },
  { label: 'Google Pay', value: 'gpay' },
  { label: 'Paytm', value: 'paytm' },
  { label: 'Bank account', value: 'bank' },
  { label: 'Manual / other', value: 'manual' },
]

export function CreateAccountModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [source, setSource] = useState<AccountSource>('phonepe')
  const [balance, setBalance] = useState('0')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      await accountsApi.create({ name, source, current_balance: parseFloat(balance) || 0 })
      onCreated()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} onClose={onClose} title="Add your first account">
      <View style={styles.form}>
        <Select label="Source" value={source} options={sourceOptions} onChange={(v) => setSource(v as AccountSource)} />
        <Input label="Account name" placeholder="e.g. My PhonePe Wallet" value={name} onChangeText={setName} />
        <Input
          label="Starting balance"
          keyboardType="decimal-pad"
          value={balance}
          onChangeText={setBalance}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.actions}>
          <Button title="Skip for now" variant="ghost" onPress={onClose} />
          <Button title="Create account" onPress={handleSubmit} loading={loading} />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  error: { color: colors.coral, fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
})
