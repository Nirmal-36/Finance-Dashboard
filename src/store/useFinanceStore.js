import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { seedTransactions } from '@/data/transactions'

const defaultFilters = {
  type: 'all',
  category: 'all',
  search: '',
  sortBy: 'date',
  sortOrder: 'desc',
}

const getStorageKey = 'finance-dashboard-store-v1'

export const useFinanceStore = create(
  persist(
    (set, get) => ({
      role: 'viewer',
      theme: 'light',
      filters: defaultFilters,
      transactions: seedTransactions,
      setRole: (role) => set({ role }),
      toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
      setFilters: (nextFilters) => set({ filters: { ...get().filters, ...nextFilters } }),
      resetFilters: () => set({ filters: defaultFilters }),
      addTransaction: (transaction) =>
        set({
          transactions: [
            {
              ...transaction,
              id: crypto.randomUUID(),
            },
            ...get().transactions,
          ],
        }),
      updateTransaction: (id, updates) =>
        set({
          transactions: get().transactions.map((transaction) =>
            transaction.id === id ? { ...transaction, ...updates } : transaction,
          ),
        }),
      deleteTransaction: (id) =>
        set({
          transactions: get().transactions.filter((transaction) => transaction.id !== id),
        }),
    }),
    {
      name: getStorageKey,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        role: state.role,
        theme: state.theme,
        filters: state.filters,
        transactions: state.transactions,
      }),
    },
  ),
)
