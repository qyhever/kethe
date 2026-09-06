import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Delete,
  LayoutList,
  NotebookPen,
  WalletCards,
  X,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CategoryIcon, type CategoryIconName } from '../components/CategoryIcon/CategoryIcon'
import { useToast } from '../components/Toast'
import './TallyPage.css'

type TallyType = 'expense' | 'income' | 'transfer' | 'other'

interface Category {
  id: string
  label: string
  icon: CategoryIconName
  color: string
  background: string
}

const tallyTypes: Array<{ id: TallyType; label: string }> = [
  { id: 'expense', label: '支出' },
  { id: 'income', label: '收入' },
  { id: 'transfer', label: '转账' },
  { id: 'other', label: '其他' },
]

const expenseCategories: Category[] = [
  { id: 'food', label: '餐饮', icon: 'food', color: '#f47a12', background: '#fff0df' },
  { id: 'transport', label: '交通', icon: 'transport', color: '#347df0', background: '#e7f0ff' },
  { id: 'shopping', label: '购物', icon: 'shopping', color: '#7951e8', background: '#eee9ff' },
  { id: 'housing', label: '住房', icon: 'housing', color: '#20b96c', background: '#e0f7eb' },
  { id: 'entertainment', label: '娱乐', icon: 'entertainment', color: '#ee5272', background: '#ffe5eb' },
  { id: 'medical', label: '医疗', icon: 'medical', color: '#f24c65', background: '#ffe5ea' },
  { id: 'education', label: '教育', icon: 'education', color: '#f2a20d', background: '#fff2d7' },
  { id: 'gift', label: '人情', icon: 'gift', color: '#ef4f70', background: '#ffe4eb' },
  { id: 'communication', label: '通讯', icon: 'communication', color: '#3a7ded', background: '#e4edff' },
  { id: 'subscription', label: '订阅', icon: 'subscription', color: '#8651ea', background: '#eee6ff' },
  { id: 'finance', label: '金融', icon: 'finance', color: '#37bda3', background: '#ddf7f1' },
  { id: 'other', label: '其它', icon: 'other', color: '#334155', background: '#edf0f4' },
]

const incomeCategories: Category[] = [
  { id: 'salary', label: '工资', icon: 'finance', color: '#27b36a', background: '#e0f7ea' },
  { id: 'bonus', label: '奖金', icon: 'gift', color: '#ef4f70', background: '#ffe4eb' },
  { id: 'investment', label: '投资', icon: 'finance', color: '#347df0', background: '#e7f0ff' },
  { id: 'part-time', label: '兼职', icon: 'education', color: '#f2a20d', background: '#fff2d7' },
  { id: 'refund', label: '退款', icon: 'shopping', color: '#7951e8', background: '#eee9ff' },
  { id: 'other-income', label: '其它', icon: 'other', color: '#334155', background: '#edf0f4' },
]

const accounts = ['微信钱包', '支付宝', '招商银行卡', '现金']

function TypeSegment({
  value,
  compact = false,
  onChange,
}: {
  value: TallyType
  compact?: boolean
  onChange: (value: TallyType) => void
}) {
  const items = compact ? tallyTypes.slice(0, 2) : tallyTypes

  return (
    <div className={`tally-segment${compact ? ' tally-segment--compact' : ''}`} role="tablist" aria-label="记账类型">
      {items.map((item) => (
        <button
          className={value === item.id ? 'is-active' : undefined}
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function TallyHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="tally-header">
      <button type="button" aria-label="返回" onClick={onBack}>
        <ArrowLeft aria-hidden="true" size={25} strokeWidth={2.1} />
      </button>
      <h1>{title}</h1>
      <span aria-hidden="true" />
    </header>
  )
}

function AmountEditor({ amount, onClear }: { amount: string; onClear: () => void }) {
  return (
    <div className="tally-amount" aria-live="polite" aria-label={`金额 ${amount || '0.00'} 元`}>
      <span className="tally-amount__currency">¥</span>
      <span className="tally-amount__caret" aria-hidden="true" />
      <strong className={amount ? 'has-value' : undefined}>{amount || '0.00'}</strong>
      {amount && (
        <button type="button" aria-label="清空金额" onClick={onClear}>
          <X aria-hidden="true" size={14} strokeWidth={3} />
        </button>
      )}
    </div>
  )
}

function FormRow({
  icon,
  label,
  value,
  muted = false,
  onClick,
}: {
  icon: ReactNode
  label: string
  value: string
  muted?: boolean
  onClick: () => void
}) {
  return (
    <button className="tally-form-row" type="button" onClick={onClick}>
      <span className="tally-form-row__icon">{icon}</span>
      <span className="tally-form-row__label">{label}</span>
      <span className={muted ? 'tally-form-row__value is-muted' : 'tally-form-row__value'}>{value}</span>
      <ChevronRight aria-hidden="true" size={20} strokeWidth={1.8} />
    </button>
  )
}

function NumericKeyboard({ onInput, onDelete }: { onInput: (key: string) => void; onDelete: () => void }) {
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  return (
    <div className="tally-keyboard" aria-label="数字键盘">
      <div className="tally-keyboard__numbers">
        {numbers.map((number) => (
          <button key={number} type="button" onClick={() => onInput(number)}>{number}</button>
        ))}
      </div>
      <div className="tally-keyboard__actions">
        <button className="tally-keyboard__delete" type="button" aria-label="退格" onClick={onDelete}>
          <Delete aria-hidden="true" size={25} strokeWidth={1.8} />
        </button>
        <button type="button" aria-label="小数点" onClick={() => onInput('.')}>.</button>
        <button type="button" onClick={() => onInput('0')}>0</button>
      </div>
    </div>
  )
}

function AccountSheet({ selected, onSelect, onClose }: { selected?: string; onSelect: (account: string) => void; onClose: () => void }) {
  return (
    <div className="account-sheet" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section role="dialog" aria-modal="true" aria-labelledby="account-title">
        <header><h2 id="account-title">选择账户</h2><button type="button" onClick={onClose}>取消</button></header>
        {accounts.map((account) => (
          <button className={selected === account ? 'is-selected' : undefined} key={account} type="button" onClick={() => onSelect(account)}>
            <WalletCards aria-hidden="true" size={22} />
            <span>{account}</span>
            {selected === account && <span aria-hidden="true">✓</span>}
          </button>
        ))}
      </section>
    </div>
  )
}

function CategoryPage({ type, selected, onTypeChange, onSelect, onBack }: {
  type: TallyType
  selected?: Category
  onTypeChange: (value: TallyType) => void
  onSelect: (category: Category) => void
  onBack: () => void
}) {
  const visibleType = type === 'income' ? 'income' : 'expense'
  const categories = visibleType === 'income' ? incomeCategories : expenseCategories

  return (
    <main className="tally-page tally-category-page">
      <div className="tally-page__content">
        <TallyHeader title="选择分类" onBack={onBack} />
        <TypeSegment compact value={visibleType} onChange={onTypeChange} />
        <section className="tally-category-list" aria-label={`${visibleType === 'income' ? '收入' : '支出'}分类`}>
          {categories.map((category) => (
            <button
              className={selected?.id === category.id ? 'is-selected' : undefined}
              key={category.id}
              type="button"
              onClick={() => onSelect(category)}
            >
              <span className="tally-category-list__icon" style={{ color: category.color, background: category.background }}>
                <CategoryIcon name={category.icon} size={27} color="currentColor" />
              </span>
              <span>{category.label}</span>
              <ChevronRight aria-hidden="true" size={20} strokeWidth={1.8} />
            </button>
          ))}
        </section>
      </div>
    </main>
  )
}

export function TallyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const dateInputRef = useRef<HTMLInputElement>(null)
  const [type, setType] = useState<TallyType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>()
  const [account, setAccount] = useState<string>()
  const [dateTime, setDateTime] = useState('2025-09-05T09:41')
  const [note, setNote] = useState('')
  const [isAccountOpen, setIsAccountOpen] = useState(false)

  const isCategoryPage = location.pathname.endsWith('/category')

  const handleTypeChange = (nextType: TallyType) => {
    setType(nextType)
    setCategory(undefined)
  }

  const handleAmountInput = (key: string) => {
    setAmount((current) => {
      if (key === '.') {
        if (current.includes('.')) return current
        return current ? `${current}.` : '0.'
      }
      const decimal = current.split('.')[1]
      if (decimal?.length === 2 || current.replace('.', '').length >= 9) return current
      if (current === '0') return key
      return `${current}${key}`
    })
  }

  const handleSave = () => {
    if (!amount || Number(amount) <= 0) {
      toast.info('请输入记账金额')
      return
    }
    if (!category) {
      toast.info('请选择分类')
      return
    }
    if (!account) {
      toast.info('请选择账户')
      return
    }
    toast.success('记账成功')
    navigate('/home')
  }

  if (isCategoryPage) {
    return (
      <CategoryPage
        type={type}
        selected={category}
        onTypeChange={handleTypeChange}
        onBack={() => navigate('/tally')}
        onSelect={(nextCategory) => {
          setCategory(nextCategory)
          navigate('/tally')
        }}
      />
    )
  }

  const formattedDate = dateTime
    ? dateTime.replace(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/, '$1年$2月$3日  $4:$5')
    : '请选择'

  return (
    <main className="tally-page tally-entry-page">
      <div className="tally-page__content">
        <TallyHeader title="记一笔" onBack={() => navigate('/home')} />
        <TypeSegment value={type} onChange={handleTypeChange} />
        <AmountEditor amount={amount} onClear={() => setAmount('')} />

        <section className="tally-form" aria-label="记账信息">
          <FormRow
            icon={<LayoutList size={23} strokeWidth={1.8} />}
            label="分类"
            value={category?.label ?? '请选择'}
            muted={!category}
            onClick={() => navigate('/tally/category')}
          />
          <FormRow
            icon={<WalletCards size={23} strokeWidth={1.8} />}
            label="账户"
            value={account ?? '请选择'}
            muted={!account}
            onClick={() => setIsAccountOpen(true)}
          />
          <FormRow
            icon={<CalendarDays size={23} strokeWidth={1.8} />}
            label="时间"
            value={formattedDate}
            onClick={() => dateInputRef.current?.showPicker()}
          />
          <label className="tally-form-row tally-note-row">
            <span className="tally-form-row__icon"><NotebookPen size={23} strokeWidth={1.8} /></span>
            <span className="tally-form-row__label">备注</span>
            <input aria-label="备注" placeholder="添加备注（选填）" value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <input
            className="tally-date-input"
            ref={dateInputRef}
            type="datetime-local"
            value={dateTime}
            onChange={(event) => setDateTime(event.target.value)}
            tabIndex={-1}
            aria-hidden="true"
          />
        </section>
      </div>

      <footer className="tally-entry-footer">
        <NumericKeyboard onInput={handleAmountInput} onDelete={() => setAmount((current) => current.slice(0, -1))} />
        <button className="tally-save" type="button" onClick={handleSave}>保存</button>
      </footer>

      {isAccountOpen && (
        <AccountSheet
          selected={account}
          onClose={() => setIsAccountOpen(false)}
          onSelect={(nextAccount) => {
            setAccount(nextAccount)
            setIsAccountOpen(false)
          }}
        />
      )}
    </main>
  )
}
