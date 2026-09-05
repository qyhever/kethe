
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  CirclePlus,
  CreditCard,
  LayoutGrid,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CategoryIcon, type CategoryIconName } from '../components/CategoryIcon/CategoryIcon'
import { useToast } from '../components/Toast'
import './FlowPage.css'

type FlowType = 'all' | 'expense' | 'income' | 'transfer' | 'other'
type TransactionType = Exclude<FlowType, 'all'>

interface FlowTransaction {
  id: string
  category: string
  detail?: string
  merchant: string
  account: string
  time: string
  amount: number
  type: TransactionType
  icon: CategoryIconName
  color: string
}

interface FlowGroup {
  id: string
  label: string
  date: string
  weekday: string
  transactions: FlowTransaction[]
}

const flowTypes: Array<{ id: FlowType; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'expense', label: '支出' },
  { id: 'income', label: '收入' },
  { id: 'transfer', label: '转账' },
  { id: 'other', label: '其他' },
]

const flowGroups: FlowGroup[] = [
  {
    id: 'today',
    label: '今天',
    date: '8 月 30 日',
    weekday: '周六',
    transactions: [
      { id: 'lunch', category: '餐饮', detail: '午餐', merchant: '沙县小吃', account: '微信', time: '12:32', amount: 38, type: 'expense', icon: 'food', color: '#ff7a25' },
      { id: 'subway', category: '交通', detail: '地铁', merchant: '地铁出行', account: '支付宝', time: '08:20', amount: 30, type: 'expense', icon: 'transport', color: '#347df0' },
    ],
  },
  {
    id: 'yesterday',
    label: '昨天',
    date: '8 月 29 日',
    weekday: '周五',
    transactions: [
      { id: 'salary', category: '工资', merchant: '公司发放', account: '招商银行卡', time: '09:00', amount: 500, type: 'income', icon: 'finance', color: '#20c66b' },
    ],
  },
  {
    id: 'aug-28',
    label: '8 月 28 日',
    date: '',
    weekday: '周四',
    transactions: [
      { id: 'daily-shopping', category: '购物', detail: '日用品', merchant: '超市购物', account: '微信', time: '20:15', amount: 86, type: 'expense', icon: 'shopping', color: '#ff9f18' },
      { id: 'movie', category: '娱乐', detail: '电影', merchant: '哪吒2', account: '支付宝', time: '18:20', amount: 70, type: 'expense', icon: 'entertainment', color: '#ff5777' },
    ],
  },
  {
    id: 'aug-27',
    label: '8 月 27 日',
    date: '',
    weekday: '周三',
    transactions: [
      { id: 'rent', category: '住房', detail: '房租', merchant: '8 月房租', account: '招商银行卡', time: '10:00', amount: 120, type: 'expense', icon: 'housing', color: '#397ff0' },
    ],
  },
]

function formatCurrency(value: number) {
  return `¥${value.toFixed(2)}`
}

function TransactionRow({ transaction }: { transaction: FlowTransaction }) {
  return (
    <button className="flow-row" type="button" aria-label={`查看${transaction.category}${transaction.detail ?? ''}流水`}>
      <span className="flow-row__icon" style={{ backgroundColor: transaction.color }}>
        <CategoryIcon name={transaction.icon} size={26} color="#fff" />
      </span>
      <span className="flow-row__copy">
        <strong>
          {transaction.category}
          {transaction.detail && <><i>·</i>{transaction.detail}</>}
        </strong>
        <small>{transaction.merchant} · {transaction.account}</small>
      </span>
      <span className="flow-row__value">
        <strong className={transaction.type === 'income' ? 'is-income' : undefined}>
          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
        </strong>
        <small>{transaction.time}</small>
      </span>
    </button>
  )
}

function FilterSheet({
  selectedType,
  minimum,
  maximum,
  resultCount,
  onTypeChange,
  onMinimumChange,
  onMaximumChange,
  onClose,
  onReset,
}: {
  selectedType: FlowType
  minimum: string
  maximum: string
  resultCount: number
  onTypeChange: (value: FlowType) => void
  onMinimumChange: (value: string) => void
  onMaximumChange: (value: string) => void
  onClose: () => void
  onReset: () => void
}) {
  const sheetRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    sheetRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <div className="flow-filter" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="flow-filter__sheet" ref={sheetRef} role="dialog" aria-modal="true" aria-labelledby="filter-title" tabIndex={-1}>
        <header className="flow-filter__header">
          <h2 id="filter-title">筛选</h2>
          <button type="button" onClick={onReset}>重置</button>
        </header>

        <div className="filter-field filter-field--date">
          <div className="filter-field__title">
            <CalendarDays aria-hidden="true" size={24} strokeWidth={2} />
            <div><strong>日期范围</strong><span>2024.08.01 – 2024.08.31</span></div>
            <ChevronRight aria-hidden="true" size={20} />
          </div>
        </div>

        <div className="filter-field filter-field--types">
          <div className="filter-field__title">
            <SlidersHorizontal aria-hidden="true" size={24} strokeWidth={2} />
            <strong>流水类型</strong>
          </div>
          <div className="filter-type-grid" aria-label="流水类型">
            {flowTypes.map((type) => (
              <button
                className={selectedType === type.id ? 'is-active' : undefined}
                key={type.id}
                type="button"
                aria-pressed={selectedType === type.id}
                onClick={() => onTypeChange(type.id)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <button className="filter-field filter-field--link" type="button">
          <span className="filter-field__title">
            <LayoutGrid aria-hidden="true" size={24} strokeWidth={2} />
            <strong>分类</strong>
          </span>
          <span>全部分类 <ChevronRight aria-hidden="true" size={20} /></span>
        </button>

        <button className="filter-field filter-field--link" type="button">
          <span className="filter-field__title">
            <CreditCard aria-hidden="true" size={24} strokeWidth={2} />
            <strong>账户</strong>
          </span>
          <span>全部账户 <ChevronRight aria-hidden="true" size={20} /></span>
        </button>

        <div className="filter-field filter-field--amount">
          <div className="filter-field__title">
            <span className="filter-yen" aria-hidden="true">¥</span>
            <strong>金额范围</strong>
          </div>
          <div className="filter-amount-inputs">
            <input inputMode="decimal" aria-label="最低金额" placeholder="最低金额" value={minimum} onChange={(event) => onMinimumChange(event.target.value)} />
            <span>–</span>
            <input inputMode="decimal" aria-label="最高金额" placeholder="最高金额" value={maximum} onChange={(event) => onMaximumChange(event.target.value)} />
          </div>
        </div>

        <div className="flow-filter__footer">
          <button type="button" onClick={onClose}>查看结果（{resultCount} 条）</button>
        </div>
      </section>
    </div>
  )
}

export function FlowPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [selectedType, setSelectedType] = useState<FlowType>('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [search, setSearch] = useState('')
  const [minimum, setMinimum] = useState('')
  const [maximum, setMaximum] = useState('')

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase()
    const min = minimum === '' ? Number.NEGATIVE_INFINITY : Number(minimum)
    const max = maximum === '' ? Number.POSITIVE_INFINITY : Number(maximum)

    return flowGroups
      .map((group) => ({
        ...group,
        transactions: group.transactions.filter((transaction) => {
          const matchesType = selectedType === 'all' || transaction.type === selectedType
          const matchesAmount = transaction.amount >= min && transaction.amount <= max
          const haystack = `${transaction.category}${transaction.detail ?? ''}${transaction.merchant}${transaction.account}`.toLowerCase()
          return matchesType && matchesAmount && (!query || haystack.includes(query))
        }),
      }))
      .filter((group) => group.transactions.length > 0)
  }, [maximum, minimum, search, selectedType])

  const visibleCount = filteredGroups.reduce((count, group) => count + group.transactions.length, 0)
  const resultCount = selectedType === 'all' && minimum === '' && maximum === '' ? 128 : visibleCount

  const resetFilters = () => {
    setSelectedType('all')
    setMinimum('')
    setMaximum('')
  }

  return (
    <div className="flow-page">
      <main className="flow-content">
        <header className="flow-navbar">
          <button className="flow-navbar__back" type="button" aria-label="返回首页" onClick={() => navigate('/home')}>
            <ArrowLeft aria-hidden="true" size={27} strokeWidth={2.1} />
          </button>
          {isSearching ? (
            <div className="flow-search">
              <Search aria-hidden="true" size={19} />
              <input autoFocus aria-label="搜索流水" placeholder="搜索流水" value={search} onChange={(event) => setSearch(event.target.value)} />
              <button type="button" aria-label="关闭搜索" onClick={() => { setSearch(''); setIsSearching(false) }}><X size={19} /></button>
            </div>
          ) : <h1>流水</h1>}
          <div className="flow-navbar__actions">
            {!isSearching && <button type="button" aria-label="搜索流水" onClick={() => setIsSearching(true)}><Search aria-hidden="true" size={27} strokeWidth={2} /></button>}
            <button type="button" aria-label="打开筛选" aria-expanded={isFilterOpen} onClick={() => setIsFilterOpen(true)}><SlidersHorizontal aria-hidden="true" size={27} strokeWidth={2} /></button>
            <button type="button" aria-label="新增流水" onClick={() => toast.info('记账功能开发中')}><CirclePlus aria-hidden="true" size={29} strokeWidth={2} /></button>
          </div>
        </header>

        <nav className="flow-type-tabs" aria-label="流水类型">
          {flowTypes.map((type) => (
            <button
              className={selectedType === type.id ? 'is-active' : undefined}
              key={type.id}
              type="button"
              aria-current={selectedType === type.id ? 'page' : undefined}
              onClick={() => setSelectedType(type.id)}
            >
              {type.label}
            </button>
          ))}
        </nav>

        <div className="flow-list">
          {filteredGroups.map((group) => {
            const expense = group.transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
            const income = group.transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)

            return (
              <section className="flow-group" key={group.id} aria-labelledby={`flow-group-${group.id}`}>
                <header className="flow-group__header">
                  <div><h2 id={`flow-group-${group.id}`}>{group.label}</h2>{group.date && <span>{group.date}</span>}<span>{group.weekday}</span></div>
                  <p><span>支出 {formatCurrency(expense)}</span><span>收入 {formatCurrency(income)}</span></p>
                </header>
                <div className="flow-group__rows">
                  {group.transactions.map((transaction) => <TransactionRow transaction={transaction} key={transaction.id} />)}
                </div>
              </section>
            )
          })}
          {filteredGroups.length === 0 && <div className="flow-empty"><Search size={30} /><p>没有找到符合条件的流水</p><button type="button" onClick={resetFilters}>清除筛选</button></div>}
        </div>
      </main>

      {isFilterOpen && (
        <FilterSheet
          selectedType={selectedType}
          minimum={minimum}
          maximum={maximum}
          resultCount={resultCount}
          onTypeChange={setSelectedType}
          onMinimumChange={setMinimum}
          onMaximumChange={setMaximum}
          onClose={() => setIsFilterOpen(false)}
          onReset={resetFilters}
        />
      )}
    </div>
  )
}
