import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import {
  AlertCircle,
  Check,
  Info,
  LoaderCircle,
  TriangleAlert,
  X,
} from 'lucide-react'
import { clsx } from 'clsx'
import {
  ToastContext,
  type ToastApi,
  type ToastOptions,
  type ToastType,
  type ToastUpdate,
} from './ToastContext'
import './Toast.css'

type ToastItem = Required<Pick<ToastOptions, 'type' | 'duration'>> & {
  id: number
  message: string
  leaving: boolean
}

const DEFAULT_DURATION = 2400
const EXIT_DURATION = 180
const MAX_TOASTS = 3

const icons = {
  success: Check,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
  loading: LoaderCircle,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const clearTimer = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const remove = useCallback(
    (id: number) => {
      clearTimer(id)
      setItems((current) => current.filter((item) => item.id !== id))
    },
    [clearTimer],
  )

  const dismissOne = useCallback(
    (id: number) => {
      clearTimer(id)
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, leaving: true } : item)),
      )
      timers.current.set(id, setTimeout(() => remove(id), EXIT_DURATION))
    },
    [clearTimer, remove],
  )

  const schedule = useCallback(
    (id: number, duration: number, type: ToastType) => {
      clearTimer(id)
      if (type !== 'loading' && duration > 0) {
        timers.current.set(id, setTimeout(() => dismissOne(id), duration))
      }
    },
    [clearTimer, dismissOne],
  )

  const show = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const id = ++nextId.current
      const type = options.type ?? 'info'
      const duration = options.duration ?? DEFAULT_DURATION

      setItems((current) => {
        const next = [
          ...current,
          { id, message, type, duration, leaving: false },
        ]
        const overflow = next.slice(0, Math.max(0, next.length - MAX_TOASTS))
        overflow.forEach((item) => clearTimer(item.id))
        return next.slice(-MAX_TOASTS)
      })
      schedule(id, duration, type)
      return id
    },
    [clearTimer, schedule],
  )

  const dismiss = useCallback(
    (id?: number) => {
      if (id !== undefined) {
        dismissOne(id)
        return
      }

      setItems((current) =>
        current.map((item) => {
          clearTimer(item.id)
          timers.current.set(item.id, setTimeout(() => remove(item.id), EXIT_DURATION))
          return { ...item, leaving: true }
        }),
      )
    },
    [clearTimer, dismissOne, remove],
  )

  const update = useCallback(
    (id: number, options: ToastUpdate) => {
      setItems((current) =>
        current.map((item) => {
          if (item.id !== id) return item

          const next = {
            ...item,
            ...options,
            leaving: false,
          }
          schedule(next.id, next.duration, next.type)
          return next
        }),
      )
    },
    [schedule],
  )

  useEffect(() => {
    const activeTimers = timers.current
    return () => activeTimers.forEach(clearTimeout)
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message, options) => show(message, { ...options, type: 'success' }),
      error: (message, options) => show(message, { ...options, type: 'error' }),
      warning: (message, options) => show(message, { ...options, type: 'warning' }),
      info: (message, options) => show(message, { ...options, type: 'info' }),
      loading: (message) => show(message, { type: 'loading', duration: 0 }),
      update,
      dismiss,
    }),
    [dismiss, show, update],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      {items.length > 0 &&
        createPortal(
          <div className="toast-viewport" aria-label="消息通知">
            {items.map((item) => {
              const Icon = icons[item.type]
              return (
                <div
                  className={clsx(
                    'toast',
                    `toast--${item.type}`,
                    item.leaving && 'toast--leaving',
                  )}
                  key={item.id}
                  role={item.type === 'error' ? 'alert' : 'status'}
                >
                  <span className="toast__icon" aria-hidden="true">
                    <Icon size={17} strokeWidth={2.2} />
                  </span>
                  <span className="toast__message">{item.message}</span>
                  {item.type !== 'loading' && (
                    <button
                      className="toast__close"
                      type="button"
                      aria-label="关闭通知"
                      onClick={() => dismiss(item.id)}
                    >
                      <X size={15} strokeWidth={2} aria-hidden="true" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}
