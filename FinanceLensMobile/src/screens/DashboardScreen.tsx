import React, { useCallback, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { MainTabParamList } from '../navigation/types'
import { dashboardApi } from '../api/dashboard'
import { accountsApi } from '../api/accounts'
import type { BalancePoint, CategoryBreakdownItem, HeatmapDay, SummaryData, UpcomingBillItem } from '../types'
import { SummaryCards } from '../components/dashboard/SummaryCards'
import { BalanceTrendChart } from '../components/dashboard/BalanceTrendChart'
import { CategoryBreakdownChart } from '../components/dashboard/CategoryBreakdownChart'
import { UpcomingBills } from '../components/dashboard/UpcomingBills'
import { CashflowHeatmap } from '../components/dashboard/CashflowHeatmap'
import { CreateAccountModal } from '../components/dashboard/CreateAccountModal'
import { ScreenHeader, Spinner, Card, EmptyState } from '../components/ui/Primitives'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'
import { colors, spacing } from '../theme'

type Props = BottomTabScreenProps<MainTabParamList, 'Overview'>

export function DashboardScreen({ navigation }: Props) {
  const userName = useAuthStore((s) => s.user?.full_name)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [trend, setTrend] = useState<BalancePoint[]>([])
  const [breakdown, setBreakdown] = useState<CategoryBreakdownItem[]>([])
  const [bills, setBills] = useState<UpcomingBillItem[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hasAccounts, setHasAccounts] = useState(true)
  const [accountModalOpen, setAccountModalOpen] = useState(false)

  const now = new Date()

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    const accounts = await accountsApi.list()
    setHasAccounts(accounts.length > 0)

    if (accounts.length === 0) {
      setLoading(false)
      setRefreshing(false)
      return
    }

    const [s, t, b, bl, h] = await Promise.all([
      dashboardApi.summary(),
      dashboardApi.balanceTrend(),
      dashboardApi.categoryBreakdown(),
      dashboardApi.upcomingBills(),
      dashboardApi.heatmap(now.getFullYear(), now.getMonth() + 1),
    ])
    setSummary(s)
    setTrend(t)
    setBreakdown(b)
    setBills(bl)
    setHeatmap(h)
    setLoading(false)
    setRefreshing(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  const header = (
    <ScreenHeader title="Overview" subtitle={userName ? `Hi, ${userName}` : 'Your spending at a glance'} />
  )

  if (loading) return <Spinner />

  if (!hasAccounts) {
    return (
      <ScrollView contentContainerStyle={styles.scroll}>
        {header}
        <Card style={styles.emptyCard}>
          <EmptyState
            title="Let's set up your first account"
            description="Add a PhonePe, GPay, or bank account to start tracking transactions."
            action={<Button title="Add account" onPress={() => setAccountModalOpen(true)} />}
          />
        </Card>
        <CreateAccountModal
          visible={accountModalOpen}
          onClose={() => setAccountModalOpen(false)}
          onCreated={() => load()}
        />
      </ScrollView>
    )
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.signal} />}
    >
      {header}
      {summary && <SummaryCards data={summary} />}
      <BalanceTrendChart data={trend} />
      <CategoryBreakdownChart
        data={breakdown}
        onCategoryPress={(categoryId) => navigation.navigate('Transactions', { categoryId: categoryId ?? undefined })}
      />
      <UpcomingBills bills={bills} />
      <CashflowHeatmap days={heatmap} year={now.getFullYear()} month={now.getMonth() + 1} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  emptyCard: { padding: spacing.lg },
})
