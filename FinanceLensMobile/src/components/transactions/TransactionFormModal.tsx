import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { Account, Category, Transaction, TransactionType } from '../../types'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import { transactionsApi } from '../../api/transactions'
import { getErrorMessage } from '../../api/client'
import { colors, spacing } from '../../theme'

export function TransactionFormModal({
  visible,
  onClose,
  onSaved,
  onDeleted,
  accounts,
  categories,
  editing,
}: {
  visible: boolean
  onClose: () => void
  onSaved: () => void
  onDeleted: () => void
  accounts: Account[]
  categories: Category[]
  editing: Transaction | null
}) {
  const [accountId, setAccountId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<TransactionType>('debit')
  const [merchant, setMerchant] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Reset form state whenever the modal opens, rather than relying on a
  // useState initializer (which only runs once on first mount and would
  // go stale across repeated opens with different `editing` values, or
  // before `accounts` has loaded — the exact bug hit on the web version
  // of this form, where a stale empty account_id caused a 422).
  useEffect(() => {
    if (!visible) return
    if (editing) {
      setAccountId(editing.account_id)
      setCategoryId(editing.category?.id ?? '')
      setAmount(editing.amount)
      setType(editing.type)
      setMerchant(editing.merchant_raw)
      setDescription(editing.description ?? '')
    } else {
      setAccountId(accounts[0]?.id ?? '')
      setCategoryId('')
      setAmount('')
      setType('debit')
      setMerchant('')
      setDescription('')
    }
    setError('')
  }, [visible, editing, accounts])

  async function handleSubmit() {
    if (!editing && !accountId) {
      setError('Add an account first.')
      return
    }
    setError('')
    setLoading(true)
    try {
      if (editing) {
        await transactionsApi.update(editing.id, {
          category_id: categoryId || undefined,
          description: description || undefined,
          amount: parseFloat(amount),
        })
      } else {
        await transactionsApi.create({
          account_id: accountId,
          category_id: categoryId || undefined,
          amount: parseFloat(amount),
          type,
          txn_timestamp: new Date().toISOString(),
          merchant_raw: merchant,
          description: description || undefined,
        })
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!editing) return
    setDeleting(true)
    try {
      await transactionsApi.remove(editing.id)
      onDeleted()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Modal visible={visible} onClose={onClose} title={editing ? 'Edit transaction' : 'Add transaction'}>
      <View style={styles.form}>
        {!editing && (
          <>
            <Select
              label="Account"
              value={accountId}
              onChange={setAccountId}
              options={accounts.map((a) => ({ label: a.name, value: a.id }))}
            />
            <Input label="Merchant" placeholder="e.g. Swiggy" value={merchant} onChangeText={setMerchant} />
            <Select
              label="Type"
              value={type}
              onChange={(v) => setType(v as TransactionType)}
              options={[
                { label: 'Debit', value: 'debit' },
                { label: 'Credit', value: 'credit' },
              ]}
            />
          </>
        )}

        <Input label="Amount" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />

        <Select
          label="Category"
          value={categoryId}
          onChange={setCategoryId}
          placeholder="Uncategorized"
          options={[{ label: 'Uncategorized', value: '' }, ...categories.map((c) => ({ label: c.name, value: c.id }))]}
        />

        <Input label="Description (optional)" value={description} onChangeText={setDescription} />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.actions}>
          {editing && (
            <Button title="Delete" variant="danger" size="sm" onPress={handleDelete} loading={deleting} />
          )}
          <View style={styles.actionsRight}>
            <Button title="Cancel" variant="ghost" onPress={onClose} />
            <Button title={editing ? 'Save' : 'Add'} onPress={handleSubmit} loading={loading} />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  error: { color: colors.coral, fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  actionsRight: { flexDirection: 'row', gap: spacing.sm },
})
