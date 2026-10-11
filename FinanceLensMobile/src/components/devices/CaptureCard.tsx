import React, { useCallback, useEffect, useState } from 'react'
import { AppState, Platform, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Badge, Card } from '../ui/Primitives'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { devicesApi } from '../../api/uploads'
import { BASE_URL, getErrorMessage } from '../../api/client'
import { capture, captureSupported, type CaptureStatus } from '../../native/capture'
import type { Account } from '../../types'
import { formatDate } from '../../lib/format'
import { colors, radius, spacing, fontSize } from '../../theme'

// The phone-side half of device capture: connect this phone with a device
// key (via pairing code), grant notification access, and watch it work.
export function CaptureCard({ accounts, refreshSignal }: { accounts: Account[]; refreshSignal?: number }) {
  const [status, setStatus] = useState<CaptureStatus | null>(null)
  const [accountId, setAccountId] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const refresh = useCallback(() => {
    capture.getStatus().then(setStatus)
  }, [])

  useFocusEffect(
    useCallback(() => {
      refresh()
      const timer = setInterval(refresh, 3000) // pick up newly captured transactions
      return () => clearInterval(timer)
    }, [refresh])
  )

  // Returning from the system "Notification access" screen.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh())
    return () => sub.remove()
  }, [refresh])

  useEffect(refresh, [refresh, refreshSignal])

  useEffect(() => {
    if (!accountId && accounts.length > 0) setAccountId(status?.accountId ?? accounts[0].id)
  }, [accounts, accountId, status?.accountId])

  if (!captureSupported) {
    return (
      <Card style={styles.card}>
        <Text style={styles.title}>Payment capture</Text>
        <Text style={styles.hint}>
          {Platform.OS === 'android'
            ? 'The capture module is missing from this installed build. Rebuild and reinstall the app (npx react-native run-android) — a JS reload is not enough.'
            : 'Payment capture is only available on Android.'}
        </Text>
      </Card>
    )
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError('')
    setInfo('')
    try {
      await fn()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
      refresh()
    }
  }

  const connect = () =>
    run(async () => {
      if (!accountId) throw new Error('Create an account first.')
      const device = await devicesApi.pair(code.trim())
      await capture.configure(BASE_URL, device.api_key, accountId)
      setCode('')
      setInfo(`Connected as "${device.device_name}".`)
    })

  const sendTest = () =>
    run(async () => {
      setInfo(`Sent test notification: ${await capture.sendTestPayment()}`)
    })

  const configured = !!status?.configured
  const ready = configured && !!status?.listenerEnabled
  const accountName = accounts.find((a) => a.id === status?.accountId)?.name

  return (
    <Card style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Payment capture</Text>
        <Badge tone={ready ? 'signal' : configured ? 'amber' : 'neutral'}>
          {ready ? 'Active' : configured ? 'Needs access' : 'Not connected'}
        </Badge>
      </View>
      <Text style={styles.hint}>
        Reads PhonePe, Google Pay and Paytm payment notifications on this phone and adds them to FinanceLens
        automatically.
      </Text>

      {!configured ? (
        <>
          <Text style={styles.label}>Account to record into</Text>
          <View style={styles.chips}>
            {accounts.map((a) => (
              <Button
                key={a.id}
                title={a.name}
                size="sm"
                variant={a.id === accountId ? 'primary' : 'secondary'}
                onPress={() => setAccountId(a.id)}
              />
            ))}
          </View>
          <Input
            label="Pairing code"
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="6-digit code from Devices → Get pairing code"
          />
          <Button title="Connect this phone" onPress={connect} loading={busy} disabled={code.length !== 6 || !accountId} fullWidth />
        </>
      ) : (
        <>
          <Text style={styles.meta}>
            Recording into {accountName ?? 'selected account'} · {status?.capturedCount ?? 0} captured
            {status && status.pendingCount > 0 ? ` · ${status.pendingCount} waiting to send` : ''}
          </Text>
          {!!status?.lastCaptureAt && (
            <Text style={styles.meta}>Last capture {formatDate(new Date(status.lastCaptureAt).toISOString(), { withTime: true })}</Text>
          )}
          {!status?.listenerEnabled && (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                Android needs you to allow “Notification access” for FinanceLens before it can read payments.
              </Text>
              <Button title="Open notification access settings" onPress={() => capture.openListenerSettings()} fullWidth />
            </View>
          )}
          {!!status?.lastError && <Text style={styles.error}>{status.lastError}</Text>}
          <Button title="Send test payment notification" onPress={sendTest} loading={busy} variant="secondary" fullWidth />
          <Text style={styles.hint}>
            Demo without real money: this posts a fake PhonePe-style notification that goes through the same capture
            path.
          </Text>
          <Button title="Disconnect this phone" onPress={() => run(() => capture.disconnect())} variant="ghost" fullWidth />
        </>
      )}

      {!!error && <Text style={styles.error}>{error}</Text>}
      {!!info && <Text style={styles.success}>{info}</Text>}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.paper, fontSize: fontSize.base, fontWeight: '600' },
  hint: { color: colors.paperDim, fontSize: fontSize.sm, lineHeight: 19 },
  label: { color: colors.paperDim, fontSize: fontSize.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  meta: { color: colors.paperFaint, fontSize: fontSize.sm },
  notice: {
    borderWidth: 1,
    borderColor: 'rgba(212,162,76,0.3)',
    backgroundColor: 'rgba(212,162,76,0.1)',
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.sm,
  },
  noticeText: { color: colors.amber, fontSize: fontSize.sm, lineHeight: 19 },
  error: { color: colors.coral, fontSize: fontSize.sm },
  success: { color: colors.signal, fontSize: fontSize.sm },
})
