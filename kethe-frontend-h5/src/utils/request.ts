/* eslint-disable @typescript-eslint/no-explicit-any */
import { request as http } from './fetch'
import type { RequestOptions } from './fetch'
import { clearTokens, getSessionIdentity, getTokens, setTokens } from '../api/token'
import type { ApiResponse, AuthTokens } from '../api/types'
import { notifyUnauthorized } from './auth-session'

const defaultOptions = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/kethe/api',
  timeout: 15000,
}

const codeMessage: Record<number, string> = {
  400: '请求错误',
  401: '登录状态失效，请重新登录',
  403: '禁止访问',
  404: '请求地址不存在',
  500: '服务器繁忙，请稍后再试',
  502: '网关错误',
  503: '服务不可用，服务器暂时过载或维护',
  504: '网关超时',
}

export class ApiError extends Error {
  status?: number
  data?: unknown

  constructor(message: string, status?: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

const refreshes = new Map<string, Promise<void>>()
const refreshHandoffMs = 1500

function expireSession(expected: AuthTokens) {
  const current = getTokens()
  if (current?.refreshToken !== expected.refreshToken || current.accessToken !== expected.accessToken) return
  clearTokens()
  notifyUnauthorized()
}

function withNoCache(params?: RequestOptions['params']) {
  return {
    ...(params || {}),
    t: Date.now(),
  }
}

function requireSameSession(expected: AuthTokens) {
  const current = getTokens()
  if (!current || getSessionIdentity(current) !== getSessionIdentity(expected)) {
    throw new ApiError('登录状态已改变，请重试', 401)
  }
  return current
}

function tokensChanged(current: AuthTokens, expected: AuthTokens) {
  return current.refreshToken !== expected.refreshToken || current.accessToken !== expected.accessToken
}

async function waitForRefresh(expected: AuthTokens) {
  const deadline = Date.now() + refreshHandoffMs
  while (Date.now() < deadline) {
    const current = requireSameSession(expected)
    if (tokensChanged(current, expected)) return current
    await new Promise((resolve) => window.setTimeout(resolve, 100))
  }
  return requireSameSession(expected)
}

async function rotateTokens(expected: AuthTokens) {
  const before = requireSameSession(expected)
  if (tokensChanged(before, expected)) return

  let response: ApiResponse<AuthTokens>
  try {
    response = await http<ApiResponse<AuthTokens>>({
      ...defaultOptions,
      method: 'POST',
      url: '/auth/refresh',
      data: { refreshToken: before.refreshToken },
    })
    if (!response.success) {
      throw new ApiError(response.message || '登录已过期，请重新登录', 401, response)
    }
  } catch (error: any) {
    const status = error instanceof ApiError ? error.status : error?.response?.status
    const invalid = status === 401 || status === 403
    // 其他标签页可能已完成轮换，但本页还没有读到共享存储里的新令牌。
    const current = invalid ? await waitForRefresh(before) : requireSameSession(before)
    if (tokensChanged(current, before)) return
    if (invalid) expireSession(before)
    throw new ApiError(codeMessage[status] || getErrorMessage(error), status, error?.data)
  }

  const current = requireSameSession(before)
  if (tokensChanged(current, before)) return
  setTokens(response.data)
}

function refreshTokens(expected: AuthTokens) {
  const key = expected.accessToken
  const pending = refreshes.get(key)
  if (pending) return pending

  const refresh = () => rotateTokens(expected)
  const task = (navigator.locks
    ? navigator.locks.request('kethe.auth.refresh', refresh)
    : refresh()
  ).finally(() => refreshes.delete(key))
  refreshes.set(key, task)
  return task
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return '请求失败'
}

function getServerErrorMessage(data: unknown) {
  if (!data || typeof data !== 'object') return undefined

  const message = (data as { message?: unknown }).message
  if (typeof message === 'string' && message) return message
  if (Array.isArray(message)) {
    const messages = message.filter((item): item is string => typeof item === 'string')
    if (messages.length > 0) return messages.join('；')
  }

  return undefined
}

async function requestRaw<T>(opts: RequestOptions, tokens: AuthTokens | null): Promise<ApiResponse<T>> {
  const method = opts.method || 'GET'
  const options: RequestOptions = {
    ...defaultOptions,
    ...opts,
    method,
    headers: {
      ...opts.headers,
      ...(tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
    },
    params: method === 'GET' ? withNoCache(opts.params) : opts.params,
  }

  try {
    return await http<ApiResponse<T>>(options)
  } catch (error: any) {
    const status = error?.response?.status
    throw new ApiError(
      getServerErrorMessage(error?.data) || codeMessage[status] || getErrorMessage(error),
      status,
      error?.data,
    )
  }
}

export async function request<T = any>(opts: RequestOptions): Promise<T> {
  const original = getTokens()
  let sent = original

  async function send() {
    const response = await requestRaw<T>(opts, sent)
    if (response.success) return response.data
    throw new ApiError(response.message || '操作失败', undefined, response)
  }

  try {
    return await send()
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || !original || opts.url === '/auth/refresh') {
      throw error
    }
  }

  await refreshTokens(original)
  sent = requireSameSession(original)
  try {
    return await send()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) expireSession(sent)
    throw error
  }
}

export function get<T = any>(
  url: string,
  params?: Record<string, any>,
  options?: Omit<RequestOptions, 'url' | 'params' | 'method'>,
) {
  return request<T>({
    method: 'GET',
    url,
    params,
    ...options,
  })
}

export function post<T = any>(
  url: string,
  data?: any,
  options?: Omit<RequestOptions, 'url' | 'data' | 'method'>,
) {
  return request<T>({
    method: 'POST',
    url,
    data,
    ...options,
  })
}

export function patch<T = any>(
  url: string,
  data?: any,
  options?: Omit<RequestOptions, 'url' | 'data' | 'method'>,
) {
  return request<T>({
    method: 'PATCH',
    url,
    data,
    ...options,
  })
}

export function put<T = any>(
  url: string,
  data?: any,
  options?: Omit<RequestOptions, 'url' | 'data' | 'method'>,
) {
  return request<T>({
    method: 'PUT',
    url,
    data,
    ...options,
  })
}

export function del<T = any>(
  url: string,
  options?: Omit<RequestOptions, 'url' | 'method'>,
) {
  return request<T>({
    method: 'DELETE',
    url,
    ...options,
  })
}
