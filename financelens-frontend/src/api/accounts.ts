import { api } from './client'
import type { Account, AccountSource, Category } from '../types'

export const accountsApi = {
  list: () => api.get<Account[]>('/accounts').then((r) => r.data),
  create: (data: { name: string; source: AccountSource; current_balance: number }) =>
    api.post<Account>('/accounts', data).then((r) => r.data),
  update: (id: string, data: Partial<{ name: string; current_balance: number }>) =>
    api.patch<Account>(`/accounts/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/accounts/${id}`),
}

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories').then((r) => r.data),
  create: (data: { name: string; color: string }) =>
    api.post<Category>('/categories', data).then((r) => r.data),
}
