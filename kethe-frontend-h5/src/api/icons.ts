import { get } from '../utils/request'

export type IconScene = 'category' | 'account' | 'member' | 'expense-project' | 'merchant'
export interface BusinessIconOption {
  id: string
  scene: IconScene
  iconKey: string
  iconName: string
  groupKey: string
  svgContent: string
  color: string | null
  isEnabled: boolean
  isDefault: boolean
  sortOrder: number
}
export interface IconCatalog { version: string; items: BusinessIconOption[] }
export const fetchIconCatalog = () => get<IconCatalog>('/icons')
