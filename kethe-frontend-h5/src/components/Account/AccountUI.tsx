import { BusinessIcon } from '../BusinessIcon'
import { useIconStore } from '../../stores/icons'
import { ChevronLeft, X } from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import type { AccountIconOption, LedgerAccount } from '../../api/types'

export function AccountIcon({ iconKey, nature, size = 24, color }: {
 iconKey: string | null; nature: 1 | 2; size?: number; color?: string
}) {
 const resourceColor = useIconStore(state => state.items.find(item => item.scene === 'account' && item.iconKey === iconKey)?.color)
 const iconColor = color ?? resourceColor ?? undefined
 return <span className={`account-icon account-icon--${nature === 2 ? 'liability' : 'asset'}${iconColor ? ' account-icon--branded' : ''}`} style={iconColor ? { '--account-icon-color': iconColor } as CSSProperties : undefined}>
  <BusinessIcon scene="account" iconKey={iconKey} size={size} color={iconColor} />
 </span>
}

export function AccountHeader({
  title,
  onBack,
  action,
}: {
  title: string
  onBack: () => void
  action?: ReactNode
}) {
  return (
    <header className="account-header">
      <button type="button" aria-label="返回" onClick={onBack}>
        <ChevronLeft />
      </button>
      <h1>{title}</h1>
      <span className="account-header__action">{action}</span>
    </header>
  )
}

export function Money({ cents }: { cents: string }) {
  const value = BigInt(cents || '0')
  const sign = value < 0n ? '-' : ''
  const absolute = value < 0n ? -value : value
  return <>{`${sign}¥ ${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`}</>
}

export function AccountRow({
  account,
  typeLabel,
  subTypeLabel,
  onClick,
}: {
  account: LedgerAccount
  typeLabel?: string
  subTypeLabel?: string
  onClick: () => void
}) {
  return (
    <button className="account-row" type="button" onClick={onClick}>
      <AccountIcon iconKey={account.iconKey} nature={account.accountNature} />
      <span className="account-row__main">
        <strong>
          {account.name}
          {account.accountNumberLast4 && ` · 尾号 ${account.accountNumberLast4}`}
        </strong>
        <small>{[typeLabel, subTypeLabel].filter(Boolean).join(' · ')}</small>
      </span>
      <span className="account-row__amount">
        <strong>
          {account.accountNature === 2 ? '欠款 ' : ''}
          <Money cents={account.accountNature === 2 ? account.outstandingDebt : account.currentBalance} />
        </strong>
        {!account.includeInNetWorth && <small>不计入净资产</small>}
      </span>
    </button>
  )
}

const focusableSelector =
  'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function AccountIconSheet({
  open,
  icons,
  value,
  nature,
  onClose,
  onConfirm,
}: {
  open: boolean
  icons: AccountIconOption[]
  value: string
  nature: 1 | 2
  onClose: () => void
  onConfirm: (key: string) => void
}) {
  const catalog = useIconStore(state => state.items)
  const titleId = useId()
  const panelRef = useRef<HTMLElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)
  const [selected, setSelected] = useState(value)
  const [category, setCategory] = useState('all')

  useEffect(() => {
    if (!open) return
    setSelected(value)
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => panelRef.current?.focus())
    return () => {
      document.body.style.overflow = overflow
      restoreRef.current?.focus()
    }
  }, [open, value])

  if (!open) return null
  const shown = icons.filter((icon) =>
    category === 'all' || icon.groupKey === category,
  )
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') return onClose()
    if (event.key !== 'Tab') return
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])
    if (!items.length) return
    const first = items[0]
    const last = items.at(-1)!
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return createPortal(
    <div className="icon-sheet" onPointerDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onKeyDown={handleKeyDown}>
        <header>
          <button type="button" aria-label="关闭" onClick={onClose}><X /></button>
          <h2 id={titleId}>选择图标</h2>
          <span />
        </header>
        <div className="icon-sheet__tabs" role="tablist" aria-label="图标分类">
          {[['all', '全部'], ...[...new Set(icons.map(icon => icon.groupKey))].map(key => [key, ({ card: '卡片', wallet: '资金', other: '其他' } as Record<string, string>)[key] ?? key])].map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={category === key} className={category === key ? 'is-selected' : ''} onClick={() => setCategory(key)}>{label}</button>
          ))}
        </div>
        <div className="icon-sheet__grid" role="radiogroup" aria-label="图标">
          {shown.map((item) => {
            const iconColor = catalog.find(icon => icon.scene === 'account' && icon.iconKey === item.key)?.color
            return (
              <button key={item.key} type="button" role="radio" aria-checked={selected === item.key} className={selected === item.key ? 'is-selected' : ''} onClick={() => setSelected(item.key)}>
                <span className={`icon-sheet__tile icon-sheet__tile--${nature === 2 ? 'liability' : 'asset'}${iconColor ? ' icon-sheet__tile--branded' : ''}`} style={iconColor ? { '--account-icon-color': iconColor } as CSSProperties : undefined}><BusinessIcon scene="account" iconKey={item.key} color={iconColor ?? undefined} /></span>
                <small>{item.label}</small>
              </button>
            )
          })}
        </div>
        <button className="icon-sheet__confirm" type="button" disabled={!selected} onClick={() => onConfirm(selected)}>确定</button>
      </section>
    </div>,
    document.body,
  )
}
