import { selectableIcons } from '../stores/icons'
import { del, get, patch, post } from '../utils/request'
export interface LedgerMember {
  id: string
  name: string
  iconKey: string
  expenseAmount?: string
}
export interface MemberPayload { name: string; iconKey: string }
export const fetchMembers = () => get<LedgerMember[]>('/members')
export const fetchMember = (id: string) => get<LedgerMember>('/members/' + id)
export const fetchMemberOptions = () => selectableIcons('member')
export const createMember = (payload: MemberPayload) => post<LedgerMember>('/members', payload)
export const updateMember = (id: string, payload: MemberPayload) => patch<LedgerMember>('/members/' + id, payload)
export const removeMember = (id: string) => del<null>('/members/' + id)
