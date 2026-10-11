import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { devicesApi } from '../../api/uploads'
import { getErrorMessage } from '../../api/client'
import type { DeviceRegisterResponse } from '../../types'
import { colors, spacing } from '../../theme'

export function DeviceRegisterModal({
  visible,
  onClose,
  onRegistered,
}: {
  visible: boolean
  onClose: () => void
  onRegistered: (result: DeviceRegisterResponse) => void
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible) {
      setName('')
      setError('')
    }
  }, [visible])

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Give this device a name, e.g. "My Pixel".')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await devicesApi.register(name.trim())
      onRegistered(result)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} onClose={onClose} title="Register a device">
      <View style={styles.form}>
        <Text style={styles.hint}>
          This creates a long-lived API key for the Accessibility Service to send captured transactions from this
          device. You'll see the key once — copy it somewhere safe.
        </Text>
        <Input label="Device name" placeholder="e.g. My Pixel 8" value={name} onChangeText={setName} />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.actions}>
          <Button title="Cancel" variant="ghost" onPress={onClose} />
          <Button title="Register" onPress={handleSubmit} loading={loading} />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  hint: { color: colors.paperDim, fontSize: 13, lineHeight: 18 },
  error: { color: colors.coral, fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
})
