import React, { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { dashboardApi, budgetsApi } from '../api/dashboard'
import { categoriesApi } from '../api/accounts'
import type { Budget, BudgetVsActualItem, Category } from '../types'
import { useAuthStore } from '../store/authStore'
import { ScreenHeader, Spinner, EmptyState } from '../components/ui/Primitives'
import { BudgetCard } from '../components/budgets/BudgetCard'
import { BudgetFormModal } from '../components/budgets/BudgetFormModal'
import { monthName } from '../lib/format'
import { colors, spacing, fontSize, radius } from '../theme'

export function BudgetsScreen() {
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const [items, setItems] = useState<BudgetVsActualItem[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<BudgetVsActualItem | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      dashboardApi.budgetVsActual(year, month),
      budgetsApi.list(year, month),
      categoriesApi.list(),
    ])
      .then(([vsActual, budgetList, cats]) => {
        setItems(vsActual)
        setBudgets(budgetList)
        setCategories(cats)
      })
      .finally(() => setLoading(false))
  }, [year, month])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  function shiftMonth(delta: number) {
    let m = month + delta
    let y = year
    if (m < 1) {
      m = 12
      y -= 1
    } else if (m > 12) {
      m = 1
      y += 1
    }
    setMonth(m)
    setYear(y)
  }

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(item: BudgetVsActualItem) {
    setEditing(item)
    setFormOpen(true)
  }

  return (
    <View style={styles.flex}>
      <View style={styles.headerWrap}>
        <ScreenHeader title="Budgets" subtitle="Monthly limits by category" />
        <View style={styles.monthRow}>
          <Pressable style={styles.monthBtn} onPress={() => shiftMonth(-1)}>
            <Text style={styles.monthBtnText}>‹</Text>
          </Pressable>
          <Text style={styles.monthLabel}>
            {monthName(month)} {year}
          </Text>
          <Pressable style={styles.monthBtn} onPress={() => shiftMonth(1)}>
            <Text style={styles.monthBtnText}>›</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState
          title="No budgets set for this month"
          description={isAdmin ? 'Tap the + button to set your first category budget.' : 'Ask an admin to set up budgets.'}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.category_id}
          renderItem={({ item }) => <BudgetCard item={item} onPress={() => isAdmin && openEdit(item)} />}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          contentContainerStyle={styles.listContent}
        />
      )}

      {isAdmin && (
        <Pressable style={styles.fab} onPress={openAdd}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}

      <BudgetFormModal
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        year={year}
        month={month}
        categories={categories}
        editing={editing}
        existingBudgets={budgets}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ink950 },
  headerWrap: { padding: spacing.lg, paddingBottom: spacing.sm },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.ink700,
    backgroundColor: colors.ink900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthBtnText: { color: colors.paper, fontSize: fontSize.lg },
  monthLabel: { color: colors.paper, fontSize: fontSize.base, fontWeight: '600' },
  listContent: { padding: spacing.lg, paddingTop: 0, paddingBottom: 100 },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.signal,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabText: { color: colors.ink950, fontSize: 28, fontWeight: '400', lineHeight: 30 },
})
