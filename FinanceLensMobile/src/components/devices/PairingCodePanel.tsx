import React, { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Primitives'
import { devicesApi } from '../../api/uploads'
import { getErrorMessage } from '../../api/client'
import { colors, radius, spacing } from '../../theme'

const CODE_TTL_MS = 3 * 60 * 1000

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

// Fetches a pairing code for `deviceId` as soon as it mounts and counts
// down to expiry. Mount it only while it should be active (i.e. while its
// parent modal is visible) so codes aren't generated needlessly.
export function PairingCodePanel({ deviceId }: { deviceId: string }) {
  const [code, setCode] = useState<string | null>(null)
  const [deadline, setDeadline] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const requestId = useRef(0)

  const fetchCode = useCallback(async () => {
    const id = ++requestId.current
    setLoading(true)
    setError('')
    try {
      const res = await devicesApi.createPairingCode(deviceId)
      if (id !== requestId.current) return
      // Prefer the server's expiry, but don't trust it if this phone's
      // clock disagrees badly — fall back to the nominal 3 minute TTL.
      const serverMs = new Date(res.expires_at).getTime() - Date.now()
      const ttl = serverMs > 0 && serverMs <= CODE_TTL_MS + 5000 ? serverMs : CODE_TTL_MS
      setCode(res.code)
      setDeadline(Date.now() + ttl)
      setRemaining(ttl)
    } catch (err) {
      if (id !== requestId.current) return
      setCode(null)
      setError(getErrorMessage(err))
    } finally {
      if (id === requestId.current) setLoading(false)
    }
  }, [deviceId])

  useEffect(() => {
    fetchCode()
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      requestId.current++ // ignore any in-flight response after unmount
    }
  }, [fetchCode])

  useEffect(() => {
    if (!code) return
    const timer = setInterval(() => {
      const left = deadline - Date.now()
      setRemaining(left)
      if (left <= 0) clearInterval(timer)
    }, 250)
    return () => clearInterval(timer)
  }, [code, deadline])

  const expired = !!code && remaining <= 0

  function handleCopy() {
    if (!code) return
    Clipboard.setString(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <Spinner />

  if (error) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.error}>{error}</Text>
        <Button title="Try again" onPress={fetchCode} variant="secondary" fullWidth />
      </View>
    )
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        Enter this code in the capture tool (e.g. <Text style={styles.mono}>--pair-code</Text>) to link it to this
        device. It works once.
      </Text>

      <View style={[styles.codeBox, expired && styles.codeBoxExpired]}>
        <Text style={[styles.code, expired && styles.codeExpired]} selectable>
          {code ? `${code.slice(0, 3)} ${code.slice(3)}` : ''}
        </Text>
        <Text style={[styles.timer, remaining < 30000 && styles.timerLow]}>
          {expired ? 'Expired' : `Expires in ${formatRemaining(remaining)}`}
        </Text>
      </View>

      {expired ? (
        <Button title="Generate new code" onPress={fetchCode} fullWidth />
      ) : (
        <Button title={copied ? 'Copied!' : 'Copy code'} onPress={handleCopy} variant="secondary" fullWidth />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  hint: { color: colors.paperDim, fontSize: 13, lineHeight: 18 },
  mono: { fontFamily: 'monospace', color: colors.paper },
  error: { color: colors.coral, fontSize: 13 },
  codeBox: {
    backgroundColor: colors.ink950,
    borderWidth: 1,
    borderColor: colors.signalDim,
    borderRadius: radius.md,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  codeBoxExpired: { borderColor: colors.ink700 },
  code: { color: colors.paper, fontSize: 44, fontWeight: '700', letterSpacing: 6, fontFamily: 'monospace' },
  codeExpired: { color: colors.paperFaint, textDecorationLine: 'line-through' },
  timer: { color: colors.signal, fontSize: 14, fontVariant: ['tabular-nums'] },
  timerLow: { color: colors.amber },
})
