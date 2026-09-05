import { createContext, useContext } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface ToastOptions {
  type?: ToastType
  duration?: number
}

export interface ToastUpdate extends ToastOptions {
  message?: string
}

export interface ToastApi {
  show: (message: string, options?: ToastOptions) => number
  success: (message: string, options?: Omit<ToastOptions, 'type'>) => number
  error: (message: string, options?: Omit<ToastOptions, 'type'>) => number
  warning: (message: string, options?: Omit<ToastOptions, 'type'>) => number
  info: (message: string, options?: Omit<ToastOptions, 'type'>) => number
  loading: (message: string) => number
  update: (id: number, options: ToastUpdate) => void
  dismiss: (id?: number) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast 必须在 ToastProvider 内使用')
  }
  return context
}
