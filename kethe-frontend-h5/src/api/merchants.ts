import { get, patch, post } from '../utils/request'
export interface Merchant {
  id: string
  name: string
  iconKey: string
}
export interface MerchantPayload {
  name: string
  iconKey: string
}
export const fetchMerchants = () => get<Merchant[]>('/merchants')
export const fetchMerchant = (id: string) => get<Merchant>('/merchants/' + id)
export const fetchMerchantOptions = () => get<string[]>('/merchants/options')
export const createMerchant = (payload: MerchantPayload) =>
  post<Merchant>('/merchants', payload)
export const updateMerchant = (id: string, payload: MerchantPayload) =>
  patch<Merchant>('/merchants/' + id, payload)
