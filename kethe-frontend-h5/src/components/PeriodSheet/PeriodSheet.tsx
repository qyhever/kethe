import { useEffect, useId, useState } from 'react'
import './PeriodSheet.css'

export interface PeriodOption {
  value: string
  label: string
}

interface PeriodSheetProps {
  open: boolean
  title: string
  options: PeriodOption[]
  selectedValue: string
  onSelect: (option: PeriodOption) => void
  onClose: () => void
}

const EXIT_DURATION = 240

export function PeriodSheet({
  open,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: PeriodSheetProps) {
  const titleId = useId()
  const [rendered, setRendered] = useState(open)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setRendered(true)
      return
    }
    if (!rendered) return

    setVisible(false)
    const timer = window.setTimeout(() => setRendered(false), EXIT_DURATION)
    return () => window.clearTimeout(timer)
  }, [open, rendered])

  useEffect(() => {
    if (!open || !rendered) return
    let visibleFrame = 0
    const mountedFrame = window.requestAnimationFrame(() => {
      visibleFrame = window.requestAnimationFrame(() => setVisible(true))
    })
    return () => {
      window.cancelAnimationFrame(mountedFrame)
      window.cancelAnimationFrame(visibleFrame)
    }
  }, [open, rendered])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!rendered) return null

  return (
    <div
      className={`period-sheet${visible ? ' is-visible' : ''}`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header><h2 id={titleId}>{title}</h2></header>
        <div className="period-sheet__grid">
          {options.map((option) => (
            <button
              className={selectedValue === option.value ? 'is-selected' : ''}
              key={option.value}
              type="button"
              aria-pressed={selectedValue === option.value}
              onClick={() => onSelect(option)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
