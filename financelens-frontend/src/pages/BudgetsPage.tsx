import { useCallback, useEffect, useState } from 'react'
import { Plus, Wallet } from 'lucide-react'
import { dashboardApi } from '../api/dashboard'
import { categoriesApi } from '../api/accounts'
import type { BudgetVsActualItem, Category } from '../types'
import { useAuthStore } from '../store/authStore'
import { PageHeader, Card, Spinner, EmptyState } from '../components/ui/Primitives'
import { Button } from '../components/ui/Button'
import { BudgetCard } from '../components/budgets/BudgetCard'
import { BudgetFormModal } from '../components/budgets/BudgetFormModal'
import { monthName } from '../lib/format'

export function BudgetsPage() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const now = new Date()
  const [year] = useState(now.getFullYear())
  const [month] = useState(now.getMonth() + 1)

  const [items, setItems] = useState<BudgetVsActualItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    dashboardApi
      .budgetVsActual(year, month)
      .then(setItems)
      .finally(() => setLoading(false))
  }, [year, month])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    categoriesApi.list().then(setCategories)
  }, [])

  const budgetedCategoryIds = new Set(items.map((i) => i.category_id))
  const availableCategories = categories.filter((c) => !budgetedCategoryIds.has(c.id))

  return (
    <div>
      <PageHeader
        title="Budgets"
        subtitle={`Spending limits for ${monthName(month)} ${year}`}
        action={
          isAdmin &&
          availableCategories.length > 0 && (
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
              Set budget
            </Button>
          )
        }
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={<Wallet className="h-8 w-8" strokeWidth={1.5} />}
            title="No budgets set yet"
            description="Set a monthly spending limit per category to track your progress."
            action={
              isAdmin && (
                <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
                  Set your first budget
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <Card className="px-6">
          {items.map((item) => (
            <BudgetCard key={item.category_id} item={item} />
          ))}
        </Card>
      )}

      <BudgetFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        categories={availableCategories}
        year={year}
        month={month}
      />
    </div>
  )
}
