import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { DateWheel } from '../DatePicker/DatePicker'
import './TransactionTimePicker.css'

type TimePrecision = 1 | 2

interface TransactionTimePickerProps {
  open: boolean
  value: string
  precision: TimePrecision
  onConfirm: (value: string, precision: TimePrecision) => void
  onClose: () => void
}

const EXIT_DURATION = 320

export function TransactionTimePicker({ open, value, precision, onConfirm, onClose }: TransactionTimePickerProps) {
  const [rendered, setRendered] = useState(open)
  const [visible, setVisible] = useState(false)
  const [draftPrecision, setDraftPrecision] = useState(precision)
  const [date, setDate] = useState(value.slice(0, 10))
  const [time, setTime] = useState(value.slice(11, 16) || '12:00')

  useEffect(() => {
    if (open) {
      setRendered(true)
      setDraftPrecision(precision)
      setDate(value.slice(0, 10))
      setTime(value.slice(11, 16) || '12:00')
      return
    }
    if (!rendered) return

    setVisible(false)
    const timer = window.setTimeout(() => setRendered(false), EXIT_DURATION)
    return () => window.clearTimeout(timer)
  }, [open, rendered, precision, value])

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
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!rendered) return null

  return createPortal(
    <div className={`transaction-time-picker${visible ? ' is-visible' : ''}`} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section role="dialog" aria-modal="true" aria-label="选择记账时间">
        <header className="transaction-time-picker__header">
          <span aria-hidden="true" />
          <div className="transaction-time-picker__tabs" role="tablist" aria-label="记账时间精度">
            <button type="button" role="tab" aria-selected={draftPrecision === 2} className={draftPrecision === 2 ? 'is-active' : undefined} onClick={() => setDraftPrecision(2)}>时刻</button>
            <button type="button" role="tab" aria-selected={draftPrecision === 1} className={draftPrecision === 1 ? 'is-active' : undefined} onClick={() => setDraftPrecision(1)}>日期</button>
          </div>
          <button className="transaction-time-picker__confirm" type="button" disabled={!date || (draftPrecision === 2 && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))} onClick={() => onConfirm(`${date}T${time}`, draftPrecision)}>确认</button>
        </header>
        <div className="transaction-time-picker__body">
          <DateWheel
            label="记账日期"
            value={date}
            onChange={setDate}
            time={draftPrecision === 2 ? time : undefined}
            onTimeChange={setTime}
          />
          {draftPrecision === 1 && <p className="transaction-time-picker__hint">仅记录日期，流水中不显示时分</p>}
        </div>
      </section>
    </div>,
    document.body,
  )
}
