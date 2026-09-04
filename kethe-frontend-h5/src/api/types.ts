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
