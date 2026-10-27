import { selectableIcons } from '../stores/icons'
import { del, get, patch, post } from '../utils/request'
export interface ExpenseProject {
  id: string
  name: string
  iconKey: string
  startDate: string | null
  endDate: string | null
  remark: string | null
  isArchived: boolean
  expenseAmount: string
  transactionCount: number
  hasTransactions: boolean
}
export interface ExpenseProjectPayload {
  name?: string
  iconKey?: string
  startDate?: string | null
  endDate?: string | null
  remark?: string | null
  isArchived?: boolean
}
export interface ProjectCategories {
  expenseAmount: string
  list: {
    categoryId: string | null
    name: string
    amount: string
    percentage: number
    canDrillDown: boolean
  }[]
}
export const fetchExpenseProjects = (status = 'active') =>
  get<ExpenseProject[]>('/expense-projects', { status })
export const fetchExpenseProject = (id: string) =>
  get<ExpenseProject>('/expense-projects/' + id)
export const fetchExpenseProjectOptions = () => selectableIcons('expense-project')
export const createExpenseProject = (payload: ExpenseProjectPayload) =>
  post<ExpenseProject>('/expense-projects', payload)
export const updateExpenseProject = (
  id: string,
  payload: ExpenseProjectPayload,
) => patch<ExpenseProject>('/expense-projects/' + id, payload)
export const removeExpenseProject = (id: string) =>
  del<null>('/expense-projects/' + id)
export const fetchProjectCategories = (id: string, parentCategoryId?: string) =>
  get<ProjectCategories>('/expense-projects/' + id + '/categories', {
    parentCategoryId,
  })
