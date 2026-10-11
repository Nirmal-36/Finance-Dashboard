import { useCallback, useEffect, useState } from 'react'
import { useCaptureStore } from '../store/captureStore'
import { useNavigate } from 'react-router-dom'
import { Plus, Wallet } from 'lucide-react'
import { dashboardApi } from '../api/dashboard'
import { accountsApi } from '../api/accounts'
import type { BalancePoint, CategoryBreakdownItem, HeatmapDay, SummaryData, UpcomingBillItem } from '../types'
import { SummaryCards } from '../components/dashboard/SummaryCards'
import { BalanceTrendChart } from '../components/dashboard/BalanceTrendChart'
import { CategoryBreakdownChart } from '../components/dashboard/CategoryBreakdownChart'
import { UpcomingBills } from '../components/dashboard/UpcomingBills'
import { CashflowHeatmap } from '../components/dashboard/CashflowHeatmap'
import { CreateAccountModal } from '../components/dashboard/CreateAccountModal'
import { PageHeader, Spinner, Card, EmptyState } from '../components/ui/Primitives'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '../store/authStore'

export function DashboardPage() {
  const navigate = useNavigate()
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [trend, setTrend] = useState<BalancePoint[]>([])
  const [breakdown, setBreakdown] = useState<CategoryBreakdownItem[]>([])
  const [bills, setBills] = useState<UpcomingBillItem[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([])
  const [loading, setLoading] = useState(true)
  const [hasAccounts, setHasAccounts] = useState(true)
  const [accountModalOpen, setAccountModalOpen] = useState(false)

  const now = new Date()

  const dataVersion = useCaptureStore((s) => s.dataVersion)

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    accountsApi.list().then((accounts) => {
      setHasAccounts(accounts.length > 0)
      if (accounts.length === 0) {
        setLoading(false)
        return
      }
      Promise.all([
        dashboardApi.summary(),
        dashboardApi.balanceTrend(),
        dashboardApi.categoryBreakdown(),
        dashboardApi.upcomingBills(),
        dashboardApi.heatmap(now.getFullYear(), now.getMonth() + 1),
      ])
        .then(([s, t, b, bl, h]) => {
          setSummary(s)
          setTrend(t)
          setBreakdown(b)
          setBills(bl)
          setHeatmap(h)
        })
        .finally(() => setLoading(false))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load(dataVersion > 0)
  }, [load, dataVersion])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!hasAccounts) {
    return (
      <div>
        <PageHeader title="Overview" subtitle="Your spending at a glance" />
        <Card className="p-6">
          <EmptyState
            icon={<Wallet className="h-8 w-8" strokeWidth={1.5} />}
            title="Let's set up your first account"
            description="Add a PhonePe, GPay, or bank account to start tracking transactions — then upload a statement or register a device to bring in your data."
            action={
              isAdmin && (
                <Button icon={<Plus className="h-4 w-4" />} onClick={() => setAccountModalOpen(true)}>
                  Add account
                </Button>
              )
            }
          />
        </Card>
        <CreateAccountModal open={accountModalOpen} onClose={() => setAccountModalOpen(false)} onCreated={() => load()} />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Overview" subtitle="Your spending at a glance" />

      {summary && <SummaryCards data={summary} />}

      <div className="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-2">
        <BalanceTrendChart data={trend} />
        <CategoryBreakdownChart
          data={breakdown}
          onCategoryClick={(categoryId) => navigate(`/transactions?category_id=${categoryId ?? ''}`)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-2">
        <UpcomingBills bills={bills} />
        <CashflowHeatmap days={heatmap} year={now.getFullYear()} month={now.getMonth() + 1} />
      </div>
    </div>
  )
}
