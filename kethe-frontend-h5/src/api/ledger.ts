import { get, post } from '../utils/request'
import type {
  CreateTransactionPayload,
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
