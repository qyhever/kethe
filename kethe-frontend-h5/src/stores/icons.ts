import { create } from 'zustand'
import { fetchIconCatalog, type BusinessIconOption, type IconScene } from '../api/icons'

const TTL = 5 * 60 * 1000
let inFlight: Promise<void> | undefined
let generation = 0
export const useIconStore = create<{
  items: BusinessIconOption[]
  version: string
  loadedAt: number
}>(() => ({ items: [], version: '', loadedAt: 0 }))

// 一个目录供所有页面使用，包含停用项以便历史记录回显；只合并成功响应。
export function loadIconCatalog(force = false): Promise<void> {
  if (inFlight) return inFlight
  if (!force && Date.now() - useIconStore.getState().loadedAt < TTL) return Promise.resolve()
  const requestGeneration = generation
  inFlight = fetchIconCatalog().then(catalog => {
    if (requestGeneration !== generation) return
    const previous = useIconStore.getState()
    useIconStore.setState({
      items: previous.version === catalog.version ? previous.items : catalog.items,
      version: catalog.version, loadedAt: Date.now(),
    })
  }).finally(() => { if (requestGeneration === generation) inFlight = undefined })
  return inFlight
}

export function resetIconCatalog() {
  generation++
  inFlight = undefined
  useIconStore.setState({ items: [], version: '', loadedAt: 0 })
}

export async function selectableIcons(scene: IconScene) {
  await loadIconCatalog(true)
  return useIconStore.getState().items.filter(item => item.scene === scene && item.isEnabled)
}
