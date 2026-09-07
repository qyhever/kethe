/* eslint-disable @typescript-eslint/no-explicit-any */
import { request as http } from './fetch'
import type { RequestOptions } from './fetch'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../api/token'
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

let refreshPromise: Promise<AuthTokens> | null = null

function expireSession() {
  clearTokens()
  notifyUnauthorized()
}

function withAuthHeader(headers?: RequestOptions['headers']) {
  const nextHeaders = { ...(headers || {}) }
  const token = getAccessToken()
  if (token) {
    nextHeaders.Authorization = `Bearer ${token}`
  }
  return nextHeaders
}

function withNoCache(params?: RequestOptions['params']) {
  return {
    ...(params || {}),
    t: Date.now(),
  }
}

async function refreshTokens() {
  if (!refreshPromise) {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      expireSession()
      throw new ApiError('登录已过期，请重新登录', 401)
    }

    refreshPromise = http<ApiResponse<AuthTokens>>({
      ...defaultOptions,
      method: 'POST',
      url: '/auth/refresh',
      data: { refreshToken },
    })
      .then((response) => {
        if (!response.success) {
          expireSession()
          throw new ApiError(response.message || '登录已过期，请重新登录', 401, response)
        }
        setTokens(response.data)
        return response.data
      })
      .catch((error: any) => {
        if (error instanceof ApiError) throw error

        const status = error?.response?.status
        if (status >= 400 && status < 500) expireSession()

        throw new ApiError(
          codeMessage[status] || getErrorMessage(error),
          status,
          error?.data,
        )
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
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

async function requestRaw<T>(opts: RequestOptions): Promise<ApiResponse<T>> {
  const method = opts.method || 'GET'
  const options: RequestOptions = {
    ...defaultOptions,
    ...opts,
    method,
    headers: withAuthHeader(opts.headers),
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

export async function request<T = any>(opts: RequestOptions, retried = false): Promise<T> {
  try {
    const response = await requestRaw<T>(opts)
    if (response.success) return response.data
    throw new ApiError(response.message || '操作失败', undefined, response)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && !retried && !opts.url.includes('/auth/refresh')) {
      await refreshTokens()
      return request<T>(opts, true)
    }

    if (error instanceof ApiError && error.status === 401) {
      expireSession()
    }

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
