import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import type { MainTabParamList } from '../navigation/types'
import { transactionsApi } from '../api/transactions'
import { accountsApi, categoriesApi } from '../api/accounts'
import type { Account, Category, Transaction, TransactionFilters } from '../types'
import { useAuthStore } from '../store/authStore'
import { ScreenHeader, Spinner, EmptyState } from '../components/ui/Primitives'
import { Input } from '../components/ui/Input'
import { TransactionRow } from '../components/transactions/TransactionRow'
import { TransactionFilterSheet } from '../components/transactions/TransactionFilterSheet'
import { TransactionFormModal } from '../components/transactions/TransactionFormModal'
import { colors, spacing, fontSize, radius } from '../theme'

type Route = RouteProp<MainTabParamList, 'Transactions'>

export function TransactionsScreen() {
  const route = useRoute<Route>()
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')

  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    page_size: 25,
    sort_by: 'txn_timestamp',
    sort_order: 'desc',
    category_id: route.params?.categoryId,
  })
  const [searchInput, setSearchInput] = useState('')
  const [items, setItems] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)

  const load = useCallback((f: TransactionFilters, append: boolean) => {
    if (append) setLoadingMore(true)
    else setLoading(true)

    transactionsApi
      .list(f)
      .then((res) => {
        setItems((prev) => (append ? [...prev, ...res.items] : res.items))
        setTotal(res.total)
        setTotalPages(res.total_pages)
      })
      .finally(() => {
        setLoading(false)
        setLoadingMore(false)
      })
  }, [])

  useFocusEffect(
    useCallback(() => {
      load(filters, false)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters])
  )

  useEffect(() => {
    accountsApi.list().then(setAccounts)
    categoriesApi.list().then(setCategories)
  }, [])

  // Debounced search-as-you-type
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput || undefined, page: 1 }))
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  function loadMore() {
    if (loadingMore || (filters.page ?? 1) >= totalPages) return
    const nextFilters = { ...filters, page: (filters.page ?? 1) + 1 }
    setFilters(nextFilters)
    load(nextFilters, true)
  }

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(txn: Transaction) {
    setEditing(txn)
    setFormOpen(true)
  }

  function refetch() {
    load({ ...filters, page: 1 }, false)
    setFilters((f) => ({ ...f, page: 1 }))
  }

  return (
    <View style={styles.flex}>
      <View style={styles.headerWrap}>
        <ScreenHeader title="Transactions" subtitle={`${total} total`} />
        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <Input placeholder="Search merchant or description..." value={searchInput} onChangeText={setSearchInput} />
          </View>
          <Pressable style={styles.filterBtn} onPress={() => setFilterOpen(true)}>
            <Text style={styles.filterBtnText}>Filter</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <EmptyState title="No transactions found" description="Try adjusting your filters, or add one manually." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionRow txn={item} isAdmin={isAdmin} onPress={() => openEdit(item)} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <Spinner size="small" /> : undefined}
          contentContainerStyle={styles.listContent}
        />
      )}

      {isAdmin && (
        <Pressable style={styles.fab} onPress={openAdd}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}

      <TransactionFilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onApply={setFilters}
        categories={categories}
      />

      <TransactionFormModal
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={refetch}
        onDeleted={refetch}
        accounts={accounts}
        categories={categories}
        editing={editing}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ink950 },
  headerWrap: { padding: spacing.lg, paddingBottom: spacing.sm },
  searchRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  searchInput: { flex: 1 },
  filterBtn: {
    borderWidth: 1,
    borderColor: colors.ink700,
    backgroundColor: colors.ink900,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  filterBtnText: { color: colors.paperDim, fontSize: fontSize.sm },
  listContent: { paddingBottom: 100 },
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
