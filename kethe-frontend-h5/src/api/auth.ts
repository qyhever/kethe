import { post } from '../utils/request'
import type { AuthTokens, LoginPayload, RegisterPayload } from './types'

export function login(payload: LoginPayload) {
  return post<AuthTokens>('/auth/login', payload)
}

export function sendRegistrationCode(email: string) {
  return post<null>('/auth/registration-code', { email })
}

export function register(payload: RegisterPayload) {
  return post<null>('/auth/register', payload)
}
