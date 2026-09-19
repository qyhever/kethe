import { post } from '../utils/request'
import type {
  AuthTokens,
  LoginPayload,
  PasswordResetPayload,
  RegisterPayload,
} from './types'

export function login(payload: LoginPayload) {
  return post<AuthTokens>('/auth/login', payload)
}

export function sendRegistrationCode(email: string) {
  return post<null>('/auth/registration-code', { email })
}

export function register(payload: RegisterPayload) {
  return post<null>('/auth/register', payload)
}

export function sendPasswordResetCode(email: string) {
  return post<null>('/auth/password-reset-code', { email })
}

export function resetPassword(payload: PasswordResetPayload) {
  return post<null>('/auth/reset-password', payload)
}
