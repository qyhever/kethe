import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CalendarRange,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ChevronRight,
  Minus,
  RefreshCw,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchDashboardOverview } from '../api/ledger'
import type {
  DashboardOverview,
  DashboardSummary,
  DashboardTransactionGroup,
  DashboardTrend,
  LedgerTransaction,
} from '../api/types'
import { CategoryIcon } from '../components/CategoryIcon/CategoryIcon'
import { Navbar } from '../components/Navbar'
import { Tabbar, type TabId } from '../components/Tarbar'
import { useToast } from '../components/Toast'
import './HomePage.css'

const ZONE = 'Asia/Shanghai'
const DEFAULT_ICON_COLOR = '#64748b'
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

interface MonthOption {
  value: string
  label: string
}

interface PeriodSummaryData extends DashboardSummary {
  label: string
  icon: LucideIcon
}

function shanghaiDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''
  return { year: get('year'), month: get('month'), day: get('day') }
}

function currentMonth() {
  const parts = shanghaiDateParts()
  return `${parts.year}-${parts.month}`
}

function createMonthOptions(): MonthOption[] {
  const [year, month] = currentMonth().split('-').map(Number)
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - index, 1))
    const value = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
    return {
      value,
      label: `${date.getUTCFullYear()} 年 ${date.getUTCMonth() + 1} 月`,
    }
  })
}

function formatCents(value: string) {
  if (!/^-?\d+$/.test(value)) return '--'
  const cents = BigInt(value)
  const negative = cents < 0n
  const absolute = negative ? -cents : cents
  const yuan = (absolute / 100n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${negative ? '-' : ''}${yuan}.${(absolute % 100n).toString().padStart(2, '0')}`
}

function formatTransactionAmount(transaction: LedgerTransaction) {
  const prefix =
    transaction.transactionType === 1
      ? '-'
      : transaction.transactionType === 2
        ? '+'
        : ''
  return `${prefix}¥ ${formatCents(transaction.amount)}`
}

function dateKey(date: Date) {
  const parts = shanghaiDateParts(date)
  return `${parts.year}-${parts.month}-${parts.day}`
}

function previousDateKey() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const now = new Date()
  for (let hours = 24; hours <= 48; hours += 24) {
    const candidate = formatter.format(
      new Date(now.getTime() - hours * 60 * 60 * 1000),
    )
    if (candidate !== dateKey(now)) return candidate
  }
  return formatter.format(new Date(now.getTime() - 24 * 60 * 60 * 1000))
}

function groupHeading(date: string) {
  const [, month, day] = date.split('-')
  if (date === dateKey(new Date())) {
    return { label: '今天', detail: `${month} 月 ${day} 日` }
  }
  if (date === previousDateKey()) {
    return { label: '昨天', detail: `${month} 月 ${day} 日` }
  }
  const weekday = WEEKDAYS[new Date(`${date}T12:00:00+08:00`).getUTCDay()]
  return { label: `${month} 月 ${day} 日`, detail: weekday }
}

function transactionTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

function TrendValue({ trend }: { trend: DashboardTrend }) {
  if (trend.direction === null || trend.percentage === null) {
    return (
      <span className="trend-value">
        <span>较上月 --</span>
      </span>
    )
  }
  const Icon =
    trend.direction === 'up'
      ? ArrowUp
      : trend.direction === 'down'
        ? ArrowDown
        : Minus
  return (
    <span className={`trend-value trend-value--${trend.direction}`}>
      <span>较上月</span>
      <Icon aria-hidden="true" size={16} strokeWidth={2.6} />
      <span>{trend.percentage.toFixed(1)}%</span>
    </span>
  )
}

function MonthSelector({
  options,
  value,
  onChange,
}: {
  options: MonthOption[]
  value: string
  onChange: (value: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selectorRef = useRef<HTMLDivElement>(null)
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? value

  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!selectorRef.current?.contains(event.target as Node)) setIsOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="month-selector" ref={selectorRef}>
      <button
        className="month-selector__button"
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((open) => !open)}
      >
        <CalendarDays aria-hidden="true" size={22} strokeWidth={2.1} />
        <span>{selectedLabel}</span>
        <ChevronDown aria-hidden="true" size={20} strokeWidth={2.2} />
      </button>
      {isOpen && (
        <div className="month-selector__menu" role="listbox" aria-label="选择月份">
          {options.map((option) => (
            <button
              className={`month-selector__option${option.value === value ? ' is-selected' : ''}`}
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
            >
              {option.label}
              {option.value === value && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MonthlyOverview({ data }: { data: DashboardOverview['month'] }) {
  return (
    <section className="overview-card" aria-labelledby="overview-title">
      <div className="overview-card__wash overview-card__wash--one" />
      <div className="overview-card__wash overview-card__wash--two" />
      <div className="overview-card__header">
        <div>
          <p className="section-kicker" id="overview-title">本月支出</p>
          <p className="overview-card__amount">
            <span>¥</span> {formatCents(data.expense)}
          </p>
          <TrendValue trend={data.trends.expense} />
        </div>
        <button className="overview-card__chart" type="button" aria-label="查看收支图表">
          <ChartNoAxesColumnIncreasing aria-hidden="true" size={28} strokeWidth={2.1} />
        </button>
      </div>
      <div className="overview-card__secondary">
        <div className="overview-metric">
          <p>本月收入</p>
          <strong>¥ {formatCents(data.income)}</strong>
          <TrendValue trend={data.trends.income} />
        </div>
        <div className="overview-metric">
          <p>本月结余</p>
          <strong>¥ {formatCents(data.balance)}</strong>
          <TrendValue trend={data.trends.balance} />
        </div>
      </div>
    </section>
  )
}

function PeriodSummaryCard({ summary }: { summary: PeriodSummaryData }) {
  const Icon = summary.icon
  return (
    <button className="period-card" type="button" aria-label={`查看${summary.label}收支`}>
      <div className="period-card__header">
        <h2>{summary.label}</h2>
        <span className="period-card__icon">
          <Icon aria-hidden="true" size={24} strokeWidth={2.1} />
        </span>
      </div>
      <div className="period-card__figures">
        <div><span>支出</span><strong>¥ {formatCents(summary.expense)}</strong></div>
        <div><span>收入</span><strong className="is-income">¥ {formatCents(summary.income)}</strong></div>
      </div>
    </button>
  )
}

function TransactionRow({ transaction }: { transaction: LedgerTransaction }) {
  const isTransfer = transaction.transactionType === 3
  const category = isTransfer
    ? '转账'
    : transaction.parentCategoryName || transaction.categoryName || '未分类'
  const detail =
    !isTransfer && transaction.parentCategoryName
      ? transaction.categoryName
      : null
  const account = isTransfer
    ? `${transaction.accountName || '未知账户'} → ${transaction.targetAccountName || '未知账户'}`
    : transaction.accountName
  return (
    <div className="transaction-row">
      <span
        className="transaction-row__icon"
        style={{ backgroundColor: transaction.iconColor || DEFAULT_ICON_COLOR }}
      >
        <CategoryIcon
          name={transaction.iconKey || 'other'}
          svgContent={transaction.svgContent}
          size={28}
          color="#fff"
        />
      </span>
      <span className="transaction-row__description">
        <span className="transaction-row__name">
          {category}
          {detail && <><span className="transaction-row__dot">·</span>{detail}</>}
        </span>
        <span className="transaction-row__account">{account}</span>
      </span>
      <span className="transaction-row__time">{transactionTime(transaction.transactionTime)}</span>
      <span className={`transaction-row__amount transaction-row__amount--${isTransfer ? 'transfer' : transaction.transactionType === 2 ? 'income' : 'expense'}`}>
        {formatTransactionAmount(transaction)}
      </span>
    </div>
  )
}

function TransactionGroupView({ group }: { group: DashboardTransactionGroup }) {
  const heading = groupHeading(group.date)
  return (
    <section className="transaction-group" aria-labelledby={`group-${group.date}`}>
      <header className="transaction-group__header">
        <div><h3 id={`group-${group.date}`}>{heading.label}</h3><span>{heading.detail}</span></div>
        <p><span>支出 ¥ {formatCents(group.expense)}</span><span className="is-income">收入 ¥ {formatCents(group.income)}</span></p>
      </header>
      <div className="transaction-group__list">
        {group.list.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)}
      </div>
    </section>
  )
}

function RecentTransactions({
  groups,
  onViewMore,
}: {
  groups: DashboardTransactionGroup[]
  onViewMore: () => void
}) {
  return (
    <section className="recent-card" aria-labelledby="recent-title">
      <header className="recent-card__header">
        <h2 id="recent-title">最近流水</h2>
        <button className="account-filter" type="button" aria-label="筛选账户">
          <span>全部账户</span>
          <ChevronDown aria-hidden="true" size={18} strokeWidth={2.2} />
        </button>
      </header>
      <div className="recent-card__body">
        {groups.length ? (
          groups.map((group) => <TransactionGroupView group={group} key={group.date} />)
        ) : (
          <div className="home-state home-state--empty">暂无流水，去记下第一笔吧</div>
        )}
      </div>
      <button className="recent-card__more" type="button" onClick={onViewMore}>
        <span>查看更多流水</span>
        <ChevronRight aria-hidden="true" size={18} strokeWidth={2.1} />
      </button>
    </section>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const options = useMemo(createMonthOptions, [])
  const [selectedMonth, setSelectedMonth] = useState(options[0].value)
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const toast = useToast()

  const load = useCallback(
    (signal: AbortSignal) => {
      setLoading(true)
      setError(null)
      setData(null)
      fetchDashboardOverview(selectedMonth, signal)
        .then(setData)
        .catch((reason: unknown) => {
          if (signal.aborted) return
          setError(reason instanceof Error ? reason.message : '首页数据加载失败')
        })
        .finally(() => {
          if (!signal.aborted) setLoading(false)
        })
    },
    [selectedMonth],
  )

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load, retryKey])

  const handleTabClick = (tabId: TabId) => {
    const labels: Record<TabId, string> = {
      home: '首页',
      chart: '图表',
      add: '记账',
      bill: '账单',
      profile: '我的',
    }
    if (tabId === 'add') return navigate('/tally')
    if (tabId !== 'home') toast.info(`${labels[tabId]}功能开发中`)
  }

  const periodSummaries: PeriodSummaryData[] = data
    ? [
        { label: '今日', ...data.today, icon: Sun },
        { label: '本周', ...data.week, icon: CalendarRange },
      ]
    : []

  return (
    <div className="home-page">
      <main className="home-content">
        <Navbar
          title="首页"
          right={<MonthSelector options={options} value={selectedMonth} onChange={setSelectedMonth} />}
        />
        {loading && <div className="home-state" role="status">正在加载首页数据…</div>}
        {!loading && error && (
          <div className="home-state home-state--error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => setRetryKey((key) => key + 1)}>
              <RefreshCw aria-hidden="true" size={17} />
              重新加载
            </button>
          </div>
        )}
        {!loading && data && (
          <>
            <MonthlyOverview data={data.month} />
            <section className="period-grid" aria-label="周期统计">
              {periodSummaries.map((summary) => <PeriodSummaryCard key={summary.label} summary={summary} />)}
            </section>
            <RecentTransactions groups={data.recent.groups} onViewMore={() => navigate('/flow')} />
          </>
        )}
        <div className="home-scroll-spacer" aria-hidden="true" />
      </main>
      <Tabbar onTabClick={handleTabClick} />
    </div>
  )
}
