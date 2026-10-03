import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { seedTransactions } from '@/data/transactions'

const defaultFilters = {
  type: 'all',
  category: 'all',
  search: '',
  dateFrom: '',
  dateTo: '',
  sortBy: 'date',
  sortOrder: 'desc',
}

const defaultBudgets = {
  Groceries: 14000,
  Rent: 70000,
  Utilities: 8000,
  Dining: 9000,
  Entertainment: 7000,
  Transport: 6000,
}

const getStorageKey = 'finance-dashboard-store-v1'

export const useFinanceStore = create(
  persist(
    (set, get) => ({
      role: 'viewer',
      theme: 'light',
      filters: defaultFilters,
      budgets: defaultBudgets,
      transactions: seedTransactions,
      setRole: (role) => set({ role }),
      toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
      setFilters: (nextFilters) => set({ filters: { ...get().filters, ...nextFilters } }),
      resetFilters: () => set({ filters: defaultFilters }),
      setCategoryBudget: (category, amount) =>
        set({
          budgets: {
            ...get().budgets,
            [category]: amount,
          },
        }),
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
        budgets: state.budgets,
        transactions: state.transactions,
      }),
    },
  ),
)
