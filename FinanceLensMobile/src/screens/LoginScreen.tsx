import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { AuthStackParamList } from '../navigation/types'
import { useAuthStore } from '../store/authStore'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { getErrorMessage } from '../api/client'
import { colors, spacing, fontSize } from '../theme'

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>

export function LoginScreen({ navigation }: Props) {
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Text style={styles.brandText}>FinanceLens</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to view your transactions</Text>

          <View style={styles.form}>
            <Input
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              label="Password"
              secureTextEntry
              autoComplete="current-password"
              value={password}
              onChangeText={setPassword}
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Button title="Sign in" onPress={handleLogin} loading={loading} fullWidth />
          </View>
        </View>

        <Pressable style={styles.footer} onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.footerText}>
            Don't have an account? <Text style={styles.footerLink}>Create one</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ink950 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  brand: { alignItems: 'center', marginBottom: spacing.xl },
  brandText: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.paper },
  card: {
    backgroundColor: colors.ink900,
    borderWidth: 1,
    borderColor: colors.ink800,
    borderRadius: 14,
    padding: spacing.xl,
  },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.paper, marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.sm, color: colors.paperDim, marginBottom: spacing.lg },
  form: { gap: spacing.md },
  error: { color: colors.coral, fontSize: fontSize.sm },
  footer: { marginTop: spacing.xl, alignItems: 'center' },
  footerText: { color: colors.paperDim, fontSize: fontSize.sm },
  footerLink: { color: colors.signal, fontWeight: '600' },
})
