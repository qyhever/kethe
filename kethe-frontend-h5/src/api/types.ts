export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
  requestId?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface CurrentUser {
  id: number
  username: string
  nickname: string
  avatar: string | null
  isEnabled: boolean
  isSystemDefault: boolean
  email: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  username: string
  nickname: string
  email: string
  password: string
  verificationCode: string
}

export interface ClipboardItem {
  id: number
  userId: number
  content: string
  contentType: 'text' | 'link' | 'image'
  title: string | null
  sourceUrl: string | null
  isPinned: boolean
  lastCopiedAt: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface ClipboardPageResult {
  list: ClipboardItem[]
  total: number
  currentPage: number
  pageSize: number
}

export interface ClipboardQuery {
  currentPage?: number
  pageSize?: number
  keyword?: string
  contentType?: ClipboardItem['contentType']
  isPinned?: boolean
}

export interface ClipboardPayload {
  title?: string
  content: string
  contentType?: ClipboardItem['contentType']
  isPinned?: boolean
}

export interface AttachUploadResult {
  fileName: string
  originName: string
  url: string
}

export interface LedgerAccount {
  id: string
  userId: number
  name: string
  accountType: number
  icon: string | null
  systemKey: string | null
  isSystemDefault: boolean
  currency: string
  initialBalance: string
  currentBalance: string
  includeInAssets: boolean
  sortOrder: number
  isEnabled: boolean
  remark: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface LedgerCategory {
  id: string
  categoryType: 1 | 2
  parentId: string | null
  name: string
  iconId: string | null
  systemKey: string | null
  isSystemDefault: boolean
  sortOrder: number
  isEnabled: boolean
  iconKey: string | null
  svgContent: string | null
  iconColor: string | null
  children: LedgerCategory[]
}

export interface CreateTransactionPayload {
  transactionType: 1 | 2 | 3
  amount: string
  categoryId?: string
  accountId: string
  targetAccountId?: string
  currency: 'CNY'
  transactionTime: string
  remark?: string
}

export type DashboardTrendDirection = 'up' | 'down' | 'flat' | null

export interface DashboardTrend {
  direction: DashboardTrendDirection
  percentage: number | null
}

export interface DashboardSummary {
  income: string
  expense: string
  balance: string
}

export interface DashboardMonthSummary extends DashboardSummary {
  trends: {
    income: DashboardTrend
    expense: DashboardTrend
    balance: DashboardTrend
  }
}

export interface LedgerTransaction {
  id: string
  transactionType: 1 | 2 | 3
  amount: string
  currency: string
  remark: string | null
  transactionTime: string
  createdAt: string
  categoryId: string | null
  categoryName: string | null
  parentCategoryId: string | null
  parentCategoryName: string | null
  iconKey: string | null
  svgContent: string | null
  iconColor: string | null
  accountId: string
  accountName: string
  targetAccountId: string | null
  targetAccountName: string | null
}

export interface TransactionQuery {
  currentPage?: number
  pageSize?: number
  startTime?: string
  endTime?: string
  transactionType?: 1 | 2 | 3
  categoryIds?: string[]
  accountIds?: string[]
  minAmount?: string
  maxAmount?: string
  keyword?: string
}

export interface TransactionPageResult {
  list: LedgerTransaction[]
  groups: DashboardTransactionGroup[]
  summaries: TransactionYearSummary[]
  total: number
  currentPage: number
  pageSize: number
}

export interface TransactionMonthSummary extends DashboardSummary {
  month: string
}

export interface TransactionYearSummary extends DashboardSummary {
  year: string
  months: TransactionMonthSummary[]
}

export interface DashboardTransactionGroup {
  date: string
  income: string
  expense: string
  list: LedgerTransaction[]
}

export interface DashboardOverview {
  month: DashboardMonthSummary
  today: DashboardSummary
  week: DashboardSummary
  recent: {
    list: LedgerTransaction[]
    groups: DashboardTransactionGroup[]
  }
}

export type ReportView = 'week' | 'month' | 'year' | 'custom'

export interface TrendQuery {
  view: ReportView
  week?: string
  month?: string
  year?: string
  startTime?: string
  endTime?: string
  accountId?: string
}

export interface TrendPoint {
  period: string
  income: string
  expense: string
}

export interface TrendReport {
  view: ReportView
  points: TrendPoint[]
}

export interface CategoryReportItem {
  categoryId: string
  categoryName: string
  amount: string
  percentage: number
  iconKey: string | null
  svgContent: string | null
  iconColor: string | null
  hasChildren: boolean
}

export interface CategoryReport {
  total: string
  list: CategoryReportItem[]
}

export interface CategoryReportQuery {
  transactionType: 1 | 2
  startTime: string
  endTime: string
  accountId?: string
  parentCategoryId?: string
}
