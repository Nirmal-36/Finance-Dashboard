import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { PairingCodePanel } from './PairingCodePanel'
import type { DeviceRegisterResponse } from '../../types'
import { colors, radius, spacing, fontSize } from '../../theme'

// Shown right after registration. Defaults to a 6-digit pairing code (no
// copy-pasting a long key); the raw key is available on the other tab.
export function DeviceKeyModal({
  visible,
  result,
  onDone,
}: {
  visible: boolean
  result: DeviceRegisterResponse | null
  onDone: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<'code' | 'key'>('code')

  useEffect(() => {
    if (visible) setTab('code')
  }, [visible])

  function handleCopy() {
    if (!result) return
    Clipboard.setString(result.api_key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal visible={visible} onClose={onDone} title="Device registered">
      <View style={styles.form}>
        <View style={styles.tabs}>
          {(['code', 'key'] as const).map((t) => (
            <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'code' ? 'Pairing code' : 'API key'}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'code' ? (
          visible && result && <PairingCodePanel deviceId={result.id} />
        ) : (
          <>
            <Text style={styles.warning}>
              Treat this key like a password. You can always get a new pairing code for "{result?.device_name}"
              from the Devices list instead of copying the key.
            </Text>

            <View style={styles.keyBox}>
              <Text style={styles.keyText} selectable>
                {result?.api_key}
              </Text>
            </View>

            <Button title={copied ? 'Copied!' : 'Copy to clipboard'} onPress={handleCopy} variant="secondary" fullWidth />
          </>
        )}
        <Button title="Done" onPress={onDone} fullWidth />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  tabs: { flexDirection: 'row', backgroundColor: colors.ink950, borderRadius: radius.sm, padding: 3 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.ink700 },
  tabText: { color: colors.paperFaint, fontSize: fontSize.sm, fontWeight: '600' },
  tabTextActive: { color: colors.paper },
  warning: { color: colors.amber, fontSize: 13, lineHeight: 18 },
  keyBox: {
    backgroundColor: colors.ink950,
    borderWidth: 1,
    borderColor: colors.ink700,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  keyText: { color: colors.paper, fontSize: fontSize.sm, fontFamily: 'monospace' },
})
