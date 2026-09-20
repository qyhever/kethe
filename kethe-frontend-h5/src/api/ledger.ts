import { del, get, patch, post, put } from '../utils/request'
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
  YearlyBill,
  CategoryIconResource,
  CategoryPayload,
  UpdateCategoryPayload,
  CategoryRemovalResult,
  AccountOptions,
  AccountPayload,
} from './types'

export function fetchAccounts() {
  return get<LedgerAccount[]>('/accounts')
}

export function fetchAccountOptions() {
  return get<AccountOptions>('/accounts/options')
}

export function createAccount(payload: AccountPayload) {
  return post<LedgerAccount>('/accounts', {
    currency: 'CNY',
    initialBalance: '0',
    ...payload,
  })
}

export function updateAccount(id: string, payload: AccountPayload) {
  return patch<LedgerAccount>(`/accounts/${id}`, payload)
}

export function fetchCategories(categoryType: 1 | 2) {
  return get<LedgerCategory[]>('/categories', { categoryType })
}

export function fetchCategoryIcons() {
  return get<CategoryIconResource[]>('/category-icons')
}

export function createCategory(payload: CategoryPayload) {
  return post<LedgerCategory>('/categories', payload)
}

export function updateCategory(id: string, payload: UpdateCategoryPayload) {
  return patch<LedgerCategory>(`/categories/${id}`, payload)
}

export function removeCategory(id: string) {
  return del<CategoryRemovalResult>(`/categories/${id}`)
}

export function orderCategories(items: { id: string; sortOrder: number }[]) {
  return put<null>('/categories/order', { items })
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

export function fetchYearlyBill(year: string, signal?: AbortSignal) {
  return get<YearlyBill>('/bills/yearly', { year }, { signal })
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
