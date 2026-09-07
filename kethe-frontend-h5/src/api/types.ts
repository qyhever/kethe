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
