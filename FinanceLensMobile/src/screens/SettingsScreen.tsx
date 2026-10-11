import React, { useCallback, useRef, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Clipboard from '@react-native-clipboard/clipboard'
import { accountsApi } from '../api/accounts'
import { devApi } from '../api/dev'
import { getErrorMessage } from '../api/client'
import type { RootStackParamList } from '../navigation/types'
import type { Account } from '../types'
import { useAuthStore } from '../store/authStore'
import { Badge, Card, EmptyState, ScreenHeader, Spinner } from '../components/ui/Primitives'
import { Button } from '../components/ui/Button'
import { CaptureCard } from '../components/devices/CaptureCard'
import { Input } from '../components/ui/Input'
import { colors, spacing, fontSize } from '../theme'

const MAX_MONTHS = 24

function AccountIdRow({ account }: { account: Account }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  function handleCopy() {
    Clipboard.setString(account.id)
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 2000)
  }

  return (
    <View style={styles.accountRow}>
      <View style={styles.accountMain}>
        <Text style={styles.accountName}>{account.name}</Text>
        <Text style={styles.accountId} selectable>
          {account.id}
        </Text>
      </View>
      <Button title={copied ? 'Copied!' : 'Copy ID'} onPress={handleCopy} variant="secondary" size="sm" />
    </View>
  )
}

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const isAdmin = user?.role === 'admin'

  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState('3')
  const [seeding, setSeeding] = useState(false)
  const [seedError, setSeedError] = useState('')
  const [seedResult, setSeedResult] = useState('')

  const loadAccounts = useCallback(() => {
    accountsApi.list().then(setAccounts).finally(() => setLoading(false))
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadAccounts()
    }, [loadAccounts])
  )

  async function handleSeed() {
    const n = Number(months)
    if (!Number.isInteger(n) || n < 1 || n > MAX_MONTHS) {
      setSeedError(`Enter a whole number of months between 1 and ${MAX_MONTHS}.`)
      setSeedResult('')
      return
    }
    setSeedError('')
    setSeedResult('')
    setSeeding(true)
    try {
      const res = await devApi.seedDemoData({ months: n })
      setSeedResult(`Created ${res.transactions_created} transactions in "${res.account_name}".`)
      loadAccounts()
    } catch (err) {
      setSeedError(getErrorMessage(err))
    } finally {
      setSeeding(false)
    }
  }

  function handleLogout() {
    Alert.alert('Log out?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logout() },
    ])
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <ScreenHeader title="Settings" subtitle="Account, tools and devices" />

      <Card style={styles.card}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{user?.full_name}</Text>
          <Badge tone={isAdmin ? 'signal' : 'neutral'}>{isAdmin ? 'Admin' : 'Viewer'}</Badge>
        </View>
        <Text style={styles.meta} selectable>
          {user?.email}
        </Text>
      </Card>

      <Text style={styles.sectionTitle}>Accounts</Text>
      <Card style={styles.card}>
        {loading ? (
          <Spinner size="small" />
        ) : accounts.length === 0 ? (
          <EmptyState title="No accounts yet" description="Add one from the Overview tab or generate demo data." />
        ) : (
          accounts.map((a, i) => (
            <View key={a.id} style={i > 0 && styles.divider}>
              <AccountIdRow account={a} />
            </View>
          ))
        )}
      </Card>

      {isAdmin && (
        <>
          <Text style={styles.sectionTitle}>Demo data</Text>
          <Card style={styles.card}>
            <Text style={styles.hint}>
              Creates a "Demo Account" with realistic fake transactions (salary, rent, food, transport, UPI transfers)
              spread over recent months. Each tap adds a new batch.
            </Text>
            <Input
              label="Months of history"
              value={months}
              onChangeText={setMonths}
              keyboardType="number-pad"
              maxLength={2}
            />
            {!!seedError && <Text style={styles.error}>{seedError}</Text>}
            {!!seedResult && <Text style={styles.success}>{seedResult}</Text>}
            <Button title="Generate demo data" onPress={handleSeed} loading={seeding} fullWidth />
          </Card>
        </>
      )}

      <Text style={styles.sectionTitle}>Capture</Text>
      <CaptureCard accounts={accounts} />

      <Text style={styles.sectionTitle}>Devices</Text>
      <Pressable onPress={() => navigation.navigate('Devices')}>
        <Card style={[styles.card, styles.linkRow]}>
          <View style={styles.accountMain}>
            <Text style={styles.accountName}>Manage devices</Text>
            <Text style={styles.meta}>Register capture devices and get pairing codes</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Card>
      </Pressable>

      <View style={styles.logoutWrap}>
        <Button title="Log out" onPress={handleLogout} variant="secondary" fullWidth />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { padding: spacing.lg, gap: spacing.md },
  sectionTitle: {
    color: colors.paperDim,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.sm,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { color: colors.paper, fontSize: fontSize.lg, fontWeight: '600' },
  meta: { color: colors.paperFaint, fontSize: fontSize.sm },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  accountMain: { flex: 1, gap: 2 },
  accountName: { color: colors.paper, fontSize: fontSize.base, fontWeight: '600' },
  accountId: { color: colors.paperFaint, fontSize: fontSize.xs, fontFamily: 'monospace' },
  divider: { borderTopWidth: 1, borderTopColor: colors.ink800, paddingTop: spacing.md },
  hint: { color: colors.paperDim, fontSize: fontSize.sm, lineHeight: 19 },
  error: { color: colors.coral, fontSize: fontSize.sm },
  success: { color: colors.signal, fontSize: fontSize.sm },
  linkRow: { flexDirection: 'row', alignItems: 'center' },
  chevron: { color: colors.paperFaint, fontSize: fontSize.xl },
  logoutWrap: { marginTop: spacing.lg },
})
