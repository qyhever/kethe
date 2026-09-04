import { get } from '../utils/request'
import type { CurrentUser } from './types'

export function fetchCurrentUser() {
  return get<CurrentUser>('/user/me')
}
