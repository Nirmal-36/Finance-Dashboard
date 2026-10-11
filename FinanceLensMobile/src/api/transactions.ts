import { api } from './client'
import type { PaginatedTransactions, Transaction, TransactionFilters, TransactionType } from '../types'

export const transactionsApi = {
  list: (filters: TransactionFilters) =>
    api.get<PaginatedTransactions>('/transactions', { params: filters }).then((r) => r.data),

  create: (data: {
    account_id: string
    category_id?: string
    amount: number
    type: TransactionType
    txn_timestamp: string
    merchant_raw: string
    description?: string
  }) => api.post<Transaction>('/transactions', data).then((r) => r.data),

  update: (
    id: string,
    data: Partial<{ category_id: string; merchant_normalized: string; description: string; amount: number }>
  ) => api.patch<Transaction>(`/transactions/${id}`, data).then((r) => r.data),

  remove: (id: string) => api.delete(`/transactions/${id}`),
}
