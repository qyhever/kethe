import { get, patch, post } from '../utils/request'
import type { CurrentUser } from './types'

export function fetchCurrentUser() {
  return get<CurrentUser>('/user/me')
}

export type ProfileUpdate = Partial<Pick<CurrentUser, 'nickname' | 'username'>>

export function updateCurrentUser(payload: ProfileUpdate) {
  return patch<CurrentUser>('/user/me', payload)
}

export function uploadCurrentAvatar(file: File) {
  const data = new FormData()
  data.append('file', file)
  return post<CurrentUser>('/user/me/avatar', data)
}
