// Mirrors app/schemas/*.py and app/models/*.py from the backend.

export type UserRole = 'viewer' | 'admin'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  is_verified: boolean
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export type AccountSource = 'phonepe' | 'gpay' | 'paytm' | 'bank' | 'manual'

export interface Account {
  id: string
  name: string
  source: AccountSource
  current_balance: string
  created_at: string
}

export interface Category {
  id: string
  name: string
  color: string
  is_system: boolean
}

export type TransactionType = 'debit' | 'credit'
export type TransactionSource = 'pdf_upload' | 'device_capture' | 'manual'
export type CategorizationStatus = 'pending' | 'ai_categorized' | 'user_confirmed' | 'failed'

export interface Transaction {
  id: string
  account_id: string
  category: Category | null
  amount: string
  type: TransactionType
  txn_timestamp: string
  merchant_raw: string
  merchant_normalized: string | null
  description: string | null
  reference_id: string | null
  source: TransactionSource
  categorization_status: CategorizationStatus
  ai_confidence: string | null
  is_recurring: boolean
  created_at: string
}

export interface PaginatedTransactions {
  items: Transaction[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface TransactionFilters {
  search?: string
  type?: TransactionType
  category_id?: string
  account_id?: string
  date_from?: string
  date_to?: string
  sort_by?: 'txn_timestamp' | 'amount'
  sort_order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

export interface Budget {
  id: string
  category_id: string
  year: number
  month: number
  limit_amount: string
}

export interface SummaryData {
  total_balance: string
  total_income: string
  total_expenses: string
  income_trend_pct: number | null
  expense_trend_pct: number | null
  period_start: string
  period_end: string
}

export interface BalancePoint {
  date: string
  running_balance: string
}

export interface CategoryBreakdownItem {
  category_id: string | null
  category_name: string
  color: string
  total_amount: string
  transaction_count: number
  percentage: number
}

export interface BudgetVsActualItem {
  category_id: string
  category_name: string
  color: string
  budget_amount: string
  actual_amount: string
  percentage_used: number
  is_over_budget: boolean
}

export interface UpcomingBillItem {
  merchant_normalized: string
  predicted_amount: string
  predicted_date: string
  category_name: string | null
  confidence: 'high' | 'medium' | 'low'
}

export interface HeatmapDay {
  date: string
  total_spent: string
  transaction_count: number
}

export type UploadStatus = 'queued' | 'parsing' | 'categorizing' | 'completed' | 'failed'

export interface StatementUpload {
  id: string
  original_filename: string
  status: UploadStatus
  transactions_found: number
  transactions_imported: number
  transactions_skipped_duplicate: number
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface Device {
  id: string
  device_name: string
  is_active: boolean
  created_at: string
  last_seen_at: string | null
}

export interface DeviceRegisterResponse {
  id: string
  device_name: string
  api_key: string
}

export interface ApiError {
  detail: string
}
