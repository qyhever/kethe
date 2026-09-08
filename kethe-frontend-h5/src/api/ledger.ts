import { get, post } from '../utils/request'
import type {
  CreateTransactionPayload,
  DashboardOverview,
  LedgerAccount,
  LedgerCategory,
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

export function fetchDashboardOverview(month: string, signal?: AbortSignal) {
  return get<DashboardOverview>('/dashboard/overview', { month }, { signal })
}
