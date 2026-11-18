import { resetIconCatalog } from './icons'
import { create } from 'zustand'
import { fetchCurrentUser, updateCurrentUser, uploadCurrentAvatar, type ProfileUpdate } from '../api/user'
import { logout } from '../api/auth'
import { clearTokens, getSessionIdentity, getTokens, hasTokens, setTokens, TOKENS_KEY } from '../api/token'
import type { AuthTokens, CurrentUser } from '../api/types'
import { registerUnauthorizedHandler } from '../utils/auth-session'

export type AuthStatus = 'checking' | 'authenticated' | 'anonymous'

interface AuthState {
  status: AuthStatus
  user: CurrentUser | null
  initialize: () => Promise<void>
  signIn: (tokens: AuthTokens) => Promise<void>
  refreshProfile: () => Promise<CurrentUser>
  saveProfile: (payload: ProfileUpdate) => Promise<void>
  saveAvatar: (file: File) => Promise<void>
  signOut: () => void
  logout: () => Promise<void>
}

let sessionIdentity: string | null = null
let sessionVersion = 0
let profileVersion = 0
let initializePromise: Promise<void> | null = null

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'checking',
  user: null,

  initialize: async () => {
    if (initializePromise) return initializePromise

    const session = sessionVersion
    sessionIdentity = getSessionIdentity(getTokens())
    initializePromise = (async () => {
      if (!hasTokens()) {
        set({ status: 'anonymous', user: null })
        return
      }

      try {
        const user = await fetchCurrentUser()
        if (session === sessionVersion && hasTokens()) set({ status: 'authenticated', user })
      } catch {
        // 401（包括刷新令牌失效）会由请求层清除会话；网络错误则保留本地会话，
        // 避免用户在临时离线时被强制退出。
        if (session === sessionVersion && get().status !== 'anonymous' && hasTokens()) {
          set({ status: 'authenticated', user: null })
        }
      }
    })()

    return initializePromise
  },

  signIn: async (tokens) => {
    const session = ++sessionVersion
    setTokens(tokens)
    sessionIdentity = getSessionIdentity(tokens)

    try {
      const user = await fetchCurrentUser()
      if (session === sessionVersion && hasTokens()) set({ status: 'authenticated', user })
    } catch (error) {
      if (!hasTokens() || session !== sessionVersion) throw error

      // 登录已经成功时，不因当前用户信息的临时网络错误阻断进入应用。
      set({ status: 'authenticated', user: null })
    }
  },

  refreshProfile: async () => {
    const session = sessionVersion
    const revision = ++profileVersion
    const user = await fetchCurrentUser()
    if (session !== sessionVersion || get().status !== 'authenticated') throw new Error('登录状态已改变')
    if (revision === profileVersion) set({ user })
    return user
  },

  saveProfile: async (payload) => {
    const session = sessionVersion
    ++profileVersion
    const user = await updateCurrentUser(payload)
    if (session !== sessionVersion || get().status !== 'authenticated') throw new Error('登录状态已改变')
    ++profileVersion
    set({ user })
  },

  saveAvatar: async (file) => {
    const session = sessionVersion
    ++profileVersion
    const user = await uploadCurrentAvatar(file)
    if (session !== sessionVersion || get().status !== 'authenticated') throw new Error('登录状态已改变')
    ++profileVersion
    set({ user })
  },

  logout: async () => {
    const expected = getSessionIdentity(getTokens())
    if (!expected) {
      get().signOut()
      return
    }

    try {
      await logout()
    } catch (error) {
      // 请求层已经处理被动失效。网络与服务端错误交给页面提示。
      if (getSessionIdentity(getTokens()) !== expected) return
      throw error
    }

    if (getSessionIdentity(getTokens()) === expected) get().signOut()
  },

  signOut: () => {
    sessionIdentity = null
    ++sessionVersion
    ++profileVersion
    initializePromise = null
    clearTokens()
    resetIconCatalog()
    set({ status: 'anonymous', user: null })
  },
}))

registerUnauthorizedHandler(() => {
  if (!getTokens()) useAuthStore.getState().signOut()
})

window.addEventListener('storage', (event) => {
  if (event.storageArea !== window.localStorage || (event.key !== TOKENS_KEY && event.key !== null)) return
  const current = getSessionIdentity(getTokens())
  if (current === sessionIdentity) return

  ++sessionVersion
  ++profileVersion
  initializePromise = null
  sessionIdentity = current
  resetIconCatalog()
  useAuthStore.setState({ status: current ? 'checking' : 'anonymous', user: null })
  if (current) void useAuthStore.getState().initialize()
})
