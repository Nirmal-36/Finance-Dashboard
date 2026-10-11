import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { Budget, BudgetVsActualItem, Category } from '../../types'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { budgetsApi } from '../../api/dashboard'
import { getErrorMessage } from '../../api/client'
import { colors, spacing } from '../../theme'

// editingBudgetVsActual carries the category + budget id we're adjusting
// (from the dashboard-style budget-vs-actual list), while allBudgets lets
// us find the underlying Budget row's id to PATCH instead of re-POSTing.
export function BudgetFormModal({
  visible,
  onClose,
  onSaved,
  year,
  month,
  categories,
  editing,
  existingBudgets,
}: {
  visible: boolean
  onClose: () => void
  onSaved: () => void
  year: number
  month: number
  categories: Category[]
  editing: BudgetVsActualItem | null
  existingBudgets: Budget[]
}) {
  const [categoryId, setCategoryId] = useState('')
  const [limitAmount, setLimitAmount] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!visible) return
    if (editing) {
      setCategoryId(editing.category_id)
      setLimitAmount(editing.budget_amount)
    } else {
      setCategoryId(categories[0]?.id ?? '')
      setLimitAmount('')
    }
    setError('')
  }, [visible, editing, categories])

  async function handleSubmit() {
    if (!categoryId) {
      setError('Choose a category.')
      return
    }
    const amount = parseFloat(limitAmount)
    if (!limitAmount || Number.isNaN(amount) || amount <= 0) {
      setError('Enter a valid budget amount.')
      return
    }

    setError('')
    setLoading(true)
    try {
      const existing = existingBudgets.find((b) => b.category_id === categoryId && b.year === year && b.month === month)
      if (existing) {
        await budgetsApi.update(existing.id, amount)
      } else {
        await budgetsApi.create({ category_id: categoryId, year, month, limit_amount: amount })
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} onClose={onClose} title={editing ? 'Edit budget' : 'Set a budget'}>
      <View style={styles.form}>
        <Select
          label="Category"
          value={categoryId}
          onChange={setCategoryId}
          options={categories.map((c) => ({ label: c.name, value: c.id }))}
        />
        <Input
          label="Monthly limit (₹)"
          keyboardType="decimal-pad"
          placeholder="e.g. 5000"
          value={limitAmount}
          onChangeText={setLimitAmount}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.actions}>
          <Button title="Cancel" variant="ghost" onPress={onClose} />
          <Button title="Save" onPress={handleSubmit} loading={loading} />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  error: { color: colors.coral, fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
})
