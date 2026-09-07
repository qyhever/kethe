import { create } from 'zustand'
import { fetchCurrentUser } from '../api/user'
import { clearTokens, hasTokens, setTokens } from '../api/token'
import type { AuthTokens, CurrentUser } from '../api/types'
import { registerUnauthorizedHandler } from '../utils/auth-session'

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous'

interface AuthState {
  status: AuthStatus
  user: CurrentUser | null
  initialize: () => Promise<void>
  signIn: (tokens: AuthTokens) => Promise<void>
  signOut: () => void
}

let initializePromise: Promise<void> | null = null

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'checking',
  user: null,

  initialize: async () => {
    if (initializePromise) return initializePromise

    initializePromise = (async () => {
      if (!hasTokens()) {
        set({ status: 'anonymous', user: null })
        return
      }

      try {
        const user = await fetchCurrentUser()
        set({ status: 'authenticated', user })
      } catch {
        // 401（包括刷新令牌失效）会由请求层清除会话；网络错误则保留本地会话，
        // 避免用户在临时离线时被强制退出。
        if (get().status !== 'anonymous' && hasTokens()) {
          set({ status: 'authenticated', user: null })
        }
      }
    })()

    return initializePromise
  },

  signIn: async (tokens) => {
    setTokens(tokens)

    try {
      const user = await fetchCurrentUser()
      set({ status: 'authenticated', user })
    } catch (error) {
      if (!hasTokens()) throw error

      // 登录已经成功时，不因当前用户信息的临时网络错误阻断进入应用。
      set({ status: 'authenticated', user: null })
    }
  },

  signOut: () => {
    clearTokens()
    set({ status: 'anonymous', user: null })
  },
}))

registerUnauthorizedHandler(() => {
  useAuthStore.getState().signOut()
})
