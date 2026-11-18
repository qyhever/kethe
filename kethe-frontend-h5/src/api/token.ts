import type { AuthTokens } from './types'

export const TOKENS_KEY = 'kethe.tokens'
const ACCESS_TOKEN_KEY = 'kethe.accessToken'
const REFRESH_TOKEN_KEY = 'kethe.refreshToken'

export function getTokens(): AuthTokens | null {
  const storage = window.localStorage
  const stored = storage.getItem(TOKENS_KEY)
  if (stored !== null) {
    try {
      const tokens = JSON.parse(stored) as Partial<AuthTokens> | null
      if (typeof tokens?.accessToken === 'string' && typeof tokens.refreshToken === 'string') {
        return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
      }
    } catch {
      return null
    }
    return null
  }

  const accessToken = storage.getItem(ACCESS_TOKEN_KEY)
  const refreshToken = storage.getItem(REFRESH_TOKEN_KEY)
  return accessToken && refreshToken ? { accessToken, refreshToken } : null
}

export function getSessionIdentity(tokens: AuthTokens | null) {
  if (!tokens) return null
  const { refreshToken } = tokens
  try {
    const payload = refreshToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { sid } = JSON.parse(atob(payload)) as { sid?: string }
    return sid || refreshToken
  } catch {
    return refreshToken
  }
}

export function setTokens(tokens: AuthTokens) {
  window.localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens))
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function clearTokens() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY)
  window.localStorage.removeItem(REFRESH_TOKEN_KEY)
  window.localStorage.removeItem(TOKENS_KEY)
}

export function hasTokens() {
  return getTokens() !== null
}
