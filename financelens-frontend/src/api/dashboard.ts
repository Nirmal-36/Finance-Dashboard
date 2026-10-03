import { api } from './client'
import type {
  BalancePoint,
  Budget,
  BudgetVsActualItem,
  CategoryBreakdownItem,
  HeatmapDay,
  SummaryData,
  UpcomingBillItem,
} from '../types'

export const dashboardApi = {
  summary: (period_start?: string, period_end?: string) =>
    api.get<SummaryData>('/dashboard/summary', { params: { period_start, period_end } }).then((r) => r.data),

  balanceTrend: (period_start?: string, period_end?: string) =>
    api.get<BalancePoint[]>('/dashboard/balance-trend', { params: { period_start, period_end } }).then((r) => r.data),

  categoryBreakdown: (period_start?: string, period_end?: string) =>
    api.get<CategoryBreakdownItem[]>('/dashboard/category-breakdown', { params: { period_start, period_end } }).then((r) => r.data),

  budgetVsActual: (year: number, month: number) =>
    api.get<BudgetVsActualItem[]>('/dashboard/budget-vs-actual', { params: { year, month } }).then((r) => r.data),

  upcomingBills: (days_ahead = 30) =>
    api.get<UpcomingBillItem[]>('/dashboard/upcoming-bills', { params: { days_ahead } }).then((r) => r.data),

  heatmap: (year: number, month: number) =>
    api.get<HeatmapDay[]>('/dashboard/heatmap', { params: { year, month } }).then((r) => r.data),
}

export const budgetsApi = {
  list: (year?: number, month?: number) => api.get<Budget[]>('/budgets', { params: { year, month } }).then((r) => r.data),
  create: (data: { category_id: string; year: number; month: number; limit_amount: number }) =>
    api.post<Budget>('/budgets', data).then((r) => r.data),
  update: (id: string, limit_amount: number) => api.patch<Budget>(`/budgets/${id}`, { limit_amount }).then((r) => r.data),
  remove: (id: string) => api.delete(`/budgets/${id}`),
}
