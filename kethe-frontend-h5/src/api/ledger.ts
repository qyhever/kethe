import { del, get, patch, post } from '../utils/request'
import type {
  CreateTransactionPayload,
  DashboardOverview,
  LedgerAccount,
  LedgerCategory,
  LedgerTransaction,
  TransactionPageResult,
  TransactionQuery,
  TrendQuery,
  TrendReport,
  CategoryReportQuery,
  CategoryReport,
} from './types'

export function fetchAccounts() {
  return get<LedgerAccount[]>('/accounts')
}

export function fetchCategories(categoryType: 1 | 2) {
  return get<LedgerCategory[]>('/categories', { categoryType })
}

export function createTransaction(payload: CreateTransactionPayload) {
  return post('/transactions', payload)
}

export function fetchTransaction(id: string) {
  return get<LedgerTransaction>(`/transactions/${id}`)
}

export function updateTransaction(
  id: string,
  payload: CreateTransactionPayload,
) {
  return patch<LedgerTransaction>(`/transactions/${id}`, payload)
}

export function deleteTransaction(id: string) {
  return del<null>(`/transactions/${id}`)
}

export function fetchTransactions(
  query: TransactionQuery,
  signal?: AbortSignal,
) {
  return post<TransactionPageResult>('/transactions/query', query, { signal })
}

export function fetchDashboardOverview(signal?: AbortSignal) {
  return get<DashboardOverview>('/dashboard/overview', undefined, { signal })
}

export function fetchTrend(query: TrendQuery, signal?: AbortSignal) {
  return get<TrendReport>('/reports/trend', query, { signal })
}

export function fetchCategoryReport(
  query: CategoryReportQuery,
  signal?: AbortSignal,
) {
  return get<CategoryReport>('/reports/categories', query, { signal })
}
