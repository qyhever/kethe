import {
  useEffect,
  useId,
  useRef,
  useState,
  type AnimationEvent,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { LoaderCircle } from 'lucide-react'
import './Dialog.css'

export interface DialogProps {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

const focusableSelector =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Dialog({
  open,
  title,
  description,
  confirmText = '确定',
  cancelText = '取消',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: DialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const confirmingRef = useRef(false)
  const [mounted, setMounted] = useState(open)

  useEffect(() => {
    if (open) setMounted(true)
  }, [open])

  useEffect(() => {
    if (!mounted) return
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.requestAnimationFrame(() => cancelRef.current?.focus())
    return () => {
      document.body.style.overflow = previousOverflow
      restoreFocusRef.current?.focus()
    }
  }, [mounted])

  if (!mounted) return null

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      if (open && !loading) onCancel()
      return
    }
    if (event.key !== 'Tab') return
    const focusable = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    )
    if (!focusable.length) {
      event.preventDefault()
      panelRef.current?.focus()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div
      className={`dialog-backdrop${open ? '' : ' dialog-backdrop--closing'}`}
      onAnimationEnd={(event: AnimationEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget && !open) setMounted(false)
      }}
      onPointerDown={(event) => {
        if (open && !loading && event.target === event.currentTarget) onCancel()
      }}
    >
      <div
        className="dialog-panel"
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        aria-busy={loading}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <div className="dialog-panel__copy">
          <h2 id={titleId}>{title}</h2>
          {description && <p id={descriptionId}>{description}</p>}
        </div>
        <div className="dialog-panel__actions">
          <button
            ref={cancelRef}
            type="button"
            disabled={loading}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={danger ? 'dialog-panel__confirm--danger' : undefined}
            type="button"
            disabled={loading}
            onClick={async () => {
              if (confirmingRef.current || loading) return
              confirmingRef.current = true
              try {
                await onConfirm()
              } finally {
                confirmingRef.current = false
              }
            }}
          >
            {loading && (
              <LoaderCircle className="dialog-panel__spinner" size={17} />
            )}
            {loading ? '处理中…' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
