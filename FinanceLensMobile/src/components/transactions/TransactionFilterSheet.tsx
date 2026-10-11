import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import type { Category, TransactionFilters } from '../../types'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { spacing } from '../../theme'

export function TransactionFilterSheet({
  visible,
  onClose,
  filters,
  onApply,
  categories,
}: {
  visible: boolean
  onClose: () => void
  filters: TransactionFilters
  onApply: (f: TransactionFilters) => void
  categories: Category[]
}) {
  const [type, setType] = useState(filters.type ?? '')
  const [categoryId, setCategoryId] = useState(filters.category_id ?? '')

  function handleApply() {
    onApply({
      ...filters,
      type: (type || undefined) as TransactionFilters['type'],
      category_id: categoryId || undefined,
      page: 1,
    })
    onClose()
  }

  function handleClear() {
    setType('')
    setCategoryId('')
    onApply({ ...filters, type: undefined, category_id: undefined, page: 1 })
    onClose()
  }

  return (
    <Modal visible={visible} onClose={onClose} title="Filter transactions">
      <View style={styles.form}>
        <Select
          label="Type"
          value={type}
          onChange={setType}
          placeholder="All types"
          options={[
            { label: 'All types', value: '' },
            { label: 'Debit', value: 'debit' },
            { label: 'Credit', value: 'credit' },
          ]}
        />
        <Select
          label="Category"
          value={categoryId}
          onChange={setCategoryId}
          placeholder="All categories"
          options={[{ label: 'All categories', value: '' }, ...categories.map((c) => ({ label: c.name, value: c.id }))]}
        />
        <View style={styles.actions}>
          <Button title="Clear" variant="ghost" onPress={handleClear} />
          <Button title="Apply filters" onPress={handleApply} />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
})
