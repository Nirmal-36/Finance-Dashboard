import React, { useCallback, useState } from 'react'
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { devicesApi } from '../api/uploads'
import type { Device, DeviceRegisterResponse } from '../types'
import { useAuthStore } from '../store/authStore'
import { ScreenHeader, Spinner, EmptyState, Card } from '../components/ui/Primitives'
import { Button } from '../components/ui/Button'
import { DeviceRow } from '../components/devices/DeviceRow'
import { DeviceRegisterModal } from '../components/devices/DeviceRegisterModal'
import { DeviceKeyModal } from '../components/devices/DeviceKeyModal'
import { PairingCodeModal } from '../components/devices/PairingCodeModal'
import { colors, spacing, fontSize } from '../theme'

export function DevicesScreen() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [pairDevice, setPairDevice] = useState<Device | null>(null)
  const [keyResult, setKeyResult] = useState<DeviceRegisterResponse | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    devicesApi.list().then(setDevices).finally(() => setLoading(false))
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  function handleRegistered(result: DeviceRegisterResponse) {
    setRegisterOpen(false)
    setKeyResult(result)
    load()
  }

  function handleRevoke(device: Device) {
    Alert.alert('Revoke device?', `"${device.device_name}" will no longer be able to send transactions.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Revoke',
        style: 'destructive',
        onPress: () => devicesApi.revoke(device.id).then(load),
      },
    ])
  }

  return (
    <View style={styles.flex}>
      <View style={styles.headerWrap}>
        <ScreenHeader title="Devices" subtitle="Manage Accessibility Service devices" />
      </View>

      {loading ? (
        <Spinner />
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DeviceRow device={item} onRevoke={() => handleRevoke(item)} onPair={() => setPairDevice(item)} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            isAdmin ? (
              <Card style={styles.infoCard}>
                <Text style={styles.infoText}>
                  Register a device to get a 6-digit pairing code for the capture tool — no copying long API keys.
                  Use "Get pairing code" on any device below to re-pair it later.
                </Text>
                <Button title="Register a device" onPress={() => setRegisterOpen(true)} fullWidth />
              </Card>
            ) : undefined
          }
          ListEmptyComponent={
            <EmptyState
              title="No devices registered"
              description={isAdmin ? 'Register a device above to get started.' : 'Ask an admin to register a device.'}
            />
          }
        />
      )}

      <DeviceRegisterModal
        visible={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegistered={handleRegistered}
      />
      <PairingCodeModal device={pairDevice} onClose={() => setPairDevice(null)} />
      <DeviceKeyModal visible={!!keyResult} result={keyResult} onDone={() => setKeyResult(null)} />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ink950 },
  headerWrap: { padding: spacing.lg, paddingBottom: spacing.sm },
  listContent: { padding: spacing.lg, paddingTop: 0, paddingBottom: spacing.xxl },
  infoCard: { padding: spacing.lg, gap: spacing.md, marginBottom: spacing.lg },
  infoText: { color: colors.paperDim, fontSize: fontSize.sm, lineHeight: 19 },
})
