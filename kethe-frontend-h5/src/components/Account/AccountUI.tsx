import {
  BadgeDollarSign,
  Building2,
  ChevronLeft,
  Coins,
  CreditCard,
  HandCoins,
  Landmark,
  PiggyBank,
  Ticket,
  WalletCards,
  X,
} from 'lucide-react'
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import type { AccountIconOption, LedgerAccount } from '../../api/types'

type AccountIconComponent = ComponentType<{ size?: number }>

function CashIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M7 9.5a2 2 0 0 1-2 2" />
      <path d="M17 9.5a2 2 0 0 0 2 2" />
      <path d="M7 14.5a2 2 0 0 0-2-2" />
      <path d="M17 14.5a2 2 0 0 1 2-2" />
      <circle cx="12" cy="12" r="2.4" />
    </svg>
  )
}

function PayPalIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8.1 3.5h5.5c3.7 0 5.8 1.9 5.3 5-.5 3.5-3 5.2-6.4 5.2h-2.1l-.8 4.8H6.1L8.1 3.5Z" fill="currentColor" opacity=".42" />
      <path d="M6.7 5.5h5.4c3.3 0 5.1 1.6 4.7 4.3-.4 3-2.6 4.5-5.6 4.5H9.3l-1 6.2H4.8L6.7 5.5Z" fill="currentColor" />
      <path d="M9.8 8.4h2.3c1.2 0 1.8.5 1.6 1.5-.2 1.1-.9 1.6-2.1 1.6H9.3l.5-3.1Z" fill="white" />
    </svg>
  )
}

function WeChatIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9.00121 14.2783C8.90179 14.3284 8.78998 14.3572 8.67104 14.3572C8.39631 14.3572 8.1572 14.2058 8.03145 13.9822L5.98105 9.48243C5.95937 9.43474 5.94574 9.38084 5.94574 9.32818C5.94574 9.12562 6.1099 8.96147 6.31246 8.96147C6.39485 8.96147 6.47073 8.98841 6.53205 9.03425L8.89497 10.7167C9.0678 10.8297 9.27408 10.896 9.49584 10.896C9.6281 10.896 9.75447 10.8713 9.87186 10.8285L20.9852 5.88214C18.9934 3.5344 15.7127 2 12 2C5.92468 2 1 6.10391 1 11.1667C1 13.9292 2.48174 16.4154 4.80067 18.096C4.98682 18.2289 5.10855 18.4469 5.10855 18.6931C5.10855 18.7746 5.0912 18.8492 5.06983 18.9267C4.88461 19.6177 4.5882 20.724 4.57426 20.7761C4.55134 20.8625 4.51511 20.9529 4.51511 21.044C4.51511 21.2462 4.67926 21.4107 4.88213 21.4107C4.96142 21.4107 5.02647 21.381 5.09368 21.3423L7.50182 19.9522C7.68301 19.8475 7.87473 19.7828 8.08596 19.7828C8.19839 19.7828 8.30711 19.8001 8.40932 19.8314C9.53301 20.1544 10.745 20.3341 12 20.3341C18.075 20.3341 23 16.2299 23 11.1667C23 9.63327 22.5459 8.18932 21.7472 6.91912L9.08143 14.2318L9.00121 14.2783Z"
        fill="currentColor"
      />
    </svg>
  )
}

function AlipayIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M1.59229 4.99313V19.007C1.59229 20.8311 3.08352 22.3106 4.92669 22.3106H19.0739C20.9157 22.3106 22.4075 20.8311 22.4075 19.007V18.8636C22.3455 18.838 16.9979 16.6282 14.2798 15.3334C12.446 17.5691 10.0808 18.9254 7.62498 18.9254C3.47231 18.9254 2.06212 15.3249 4.02841 12.9547C4.45713 12.438 5.18646 11.9444 6.31839 11.6681C8.08911 11.2371 10.9071 11.9372 13.5484 12.8007C14.0235 11.9336 14.4232 10.9787 14.7209 9.96195H6.58145V9.14532H10.7785V7.68083H5.69513V6.86366H10.7785V4.77467C10.7785 4.77467 10.7785 4.4228 11.1384 4.4228H13.1901V6.86359H18.2154V7.68097H13.1901V9.14532H17.2921C16.8996 10.7384 16.3036 12.2048 15.5554 13.4921C15.9967 13.6503 16.422 13.8055 16.8243 13.9524C17.5569 14.2198 18.2131 14.4594 18.7507 14.6377C21.5287 15.5586 22.3073 15.6712 22.4077 15.6829V4.99319C22.4077 3.16769 20.9158 1.68903 19.0741 1.68903L4.92669 1.68896C3.08352 1.68896 1.59229 3.16762 1.59229 4.99313Z"
        fill="currentColor"
      />
      <path
        d="M6.67164 12.8911C6.85201 12.8735 7.03108 12.8639 7.20932 12.8619C8.93241 12.8421 10.5729 13.5253 12.4777 14.4461C11.0003 16.355 9.11958 17.5472 7.23729 17.5472C3.99926 17.5472 3.04172 15.0203 4.64156 13.638C5.17532 13.1702 6.15163 12.9429 6.67164 12.8911Z"
        fill="currentColor"
      />
    </svg>
  )
}

const ICONS: Record<string, AccountIconComponent> = {
  cash: CashIcon,
  'credit-card': CreditCard,
  'consumer-credit': HandCoins,
  'bank-card': Landmark,
  savings: PiggyBank,
  wallet: WalletCards,
  wechat: WeChatIcon,
  alipay: AlipayIcon,
  paypal: PayPalIcon,
  'stored-value-card': BadgeDollarSign,
  voucher: Ticket,
  coins: Coins,
}

const ICON_COLORS: Partial<Record<string, string>> = {
  cash: '#5BC982',
  'bank-card': '#E63343',
  savings: '#F39A5A',
  wallet: '#3B82F6',
  paypal: '#0070E0',
  wechat: '#07C160',
  alipay: '#1484E6',
  'stored-value-card': '#F39A5A',
  voucher: '#F97316',
  coins: '#F39A5A',
}

function iconColorStyle(iconKey: string | null, colorOverride?: string): CSSProperties | undefined {
  const color = colorOverride ?? (iconKey ? ICON_COLORS[iconKey] : undefined)
  return color ? ({ '--account-icon-color': color } as CSSProperties) : undefined
}

export function AccountIcon({
  iconKey,
  nature,
  size = 24,
  color,
}: {
  iconKey: string | null
  nature: 1 | 2
  size?: number
  color?: string
}) {
  const Icon = (iconKey && ICONS[iconKey]) || WalletCards
  const iconColor = color ?? (iconKey ? ICON_COLORS[iconKey] : undefined)
  const branded = Boolean(iconColor)
  return (
    <span className={`account-icon account-icon--${nature === 2 ? 'liability' : 'asset'}${branded ? ' account-icon--branded' : ''}`} style={iconColorStyle(iconKey, iconColor)}>
      <Icon size={size} />
    </span>
  )
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
  const titleId = useId()
  const panelRef = useRef<HTMLElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)
  const [selected, setSelected] = useState(value)
  const [category, setCategory] = useState<'all' | 'card' | 'wallet'>('all')

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
  const cardKeys = new Set(['credit-card', 'bank-card', 'stored-value-card'])
  const shown = icons.filter((icon) =>
    category === 'all' ? true : category === 'card' ? cardKeys.has(icon.key) : !cardKeys.has(icon.key),
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
          {([['all', '全部'], ['card', '卡片'], ['wallet', '资金']] as const).map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={category === key} className={category === key ? 'is-selected' : ''} onClick={() => setCategory(key)}>{label}</button>
          ))}
        </div>
        <div className="icon-sheet__grid" role="radiogroup" aria-label="图标">
          {shown.map((item) => {
            const Icon = ICONS[item.key] || Building2
            const branded = Boolean(ICON_COLORS[item.key])
            return (
              <button key={item.key} type="button" role="radio" aria-checked={selected === item.key} className={selected === item.key ? 'is-selected' : ''} onClick={() => setSelected(item.key)}>
                <span className={`icon-sheet__tile icon-sheet__tile--${nature === 2 ? 'liability' : 'asset'}${branded ? ' icon-sheet__tile--branded' : ''}`} style={iconColorStyle(item.key)}><Icon /></span>
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
