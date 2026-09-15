import { useEffect, useId, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import './DatePicker.css'

export interface DatePickerProps {
  id?: string
  label?: string
  value: string
  onChange: (value: string) => void
  onClose: () => void
}

function dateFromParts(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, '0')}-${month
    .toString()
    .padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

function dateParts(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return { year, month, day }
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function WheelColumn({
  label,
  values,
  value,
  suffix,
  onChange,
}: {
  label: string
  values: number[]
  value: number
  suffix: string
  onChange: (value: number) => void
}) {
  const listRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<number | null>(null)
  const itemHeight = 44

  useEffect(() => {
    const index = values.indexOf(value)
    if (index >= 0) listRef.current?.scrollTo({ top: index * itemHeight })
  }, [value, values])

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    },
    [],
  )

  return (
    <div className="date-wheel__column">
      <div
        className="date-wheel__list"
        ref={listRef}
        role="listbox"
        aria-label={label}
        tabIndex={0}
        onScroll={(event) => {
          if (timerRef.current !== null) window.clearTimeout(timerRef.current)
          const scrollTop = event.currentTarget.scrollTop
          timerRef.current = window.setTimeout(() => {
            const index = Math.max(
              0,
              Math.min(values.length - 1, Math.round(scrollTop / itemHeight)),
            )
            if (values[index] !== value) onChange(values[index])
          }, 90)
        }}
      >
        {values.map((item) => (
          <button
            className={item === value ? 'is-selected' : undefined}
            key={item}
            type="button"
            role="option"
            aria-selected={item === value}
            onClick={() => onChange(item)}
          >
            {item}
            {suffix}
          </button>
        ))}
      </div>
    </div>
  )
}

function DateWheel({
  label,
  value,
  onChange,
}: Pick<DatePickerProps, 'label' | 'value' | 'onChange'> & {
  label: string
}) {
  const selected = dateParts(value)
  const currentYear = new Date().getFullYear()
  const lastYear = Math.max(currentYear + 10, selected.year)
  const years = useMemo(
    () => Array.from({ length: lastYear - 1899 }, (_, index) => 1900 + index),
    [lastYear],
  )
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), [])
  const days = useMemo(
    () =>
      Array.from(
        { length: daysInMonth(selected.year, selected.month) },
        (_, i) => i + 1,
      ),
    [selected.month, selected.year],
  )
  const update = (year: number, month: number, day: number) =>
    onChange(
      dateFromParts(year, month, Math.min(day, daysInMonth(year, month))),
    )

  return (
    <div className="date-wheel" aria-label={label}>
      <div className="date-wheel__selection" aria-hidden="true" />
      <WheelColumn
        label={`${label}年份`}
        values={years}
        value={selected.year}
        suffix="年"
        onChange={(year) => update(year, selected.month, selected.day)}
      />
      <WheelColumn
        label={`${label}月份`}
        values={months}
        value={selected.month}
        suffix="月"
        onChange={(month) => update(selected.year, month, selected.day)}
      />
      <WheelColumn
        label={`${label}日期`}
        values={days}
        value={selected.day}
        suffix="日"
        onChange={(day) => update(selected.year, selected.month, day)}
      />
    </div>
  )
}

export function DatePicker({
  id,
  label = '选择日期',
  value,
  onChange,
  onClose,
}: DatePickerProps) {
  const generatedId = useId()
  const dialogId = id ?? `date-picker-${generatedId}`
  const titleId = `${dialogId}-title`

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <div
      className="date-picker-popup"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="date-picker-popup__sheet"
        id={dialogId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="date-picker-popup__header">
          <span aria-hidden="true" />
          <h4 id={titleId}>{label}</h4>
          <button type="button" autoFocus onClick={onClose}>
            完成
          </button>
        </header>
        <DateWheel label={label} value={value} onChange={onChange} />
      </section>
    </div>,
    document.body,
  )
}
