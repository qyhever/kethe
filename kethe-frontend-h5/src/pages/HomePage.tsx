import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CalendarRange,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ChevronRight,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CategoryIcon, type CategoryIconName } from '../components/CategoryIcon/CategoryIcon'
import { Navbar } from '../components/Navbar'
import { Tabbar, type TabId } from '../components/Tarbar'
import { useToast } from '../components/Toast'
import './HomePage.css'

type TrendDirection = 'up' | 'down'

interface Trend {
  direction: TrendDirection
  value: string
}

interface MonthlyOverviewData {
  expense: string
  expenseTrend: Trend
  income: string
  incomeTrend: Trend
  balance: string
  balanceTrend: Trend
}

interface PeriodSummaryData {
  label: string
  expense: string
  income: string
  icon: LucideIcon
}

interface Transaction {
  id: string
  category: string
  detail?: string
  account: string
  time: string
  amount: string
  type: 'expense' | 'income'
  icon: CategoryIconName
  color: string
}

interface TransactionGroup {
  label: string
  date: string
  expense: string
  income: string
  transactions: Transaction[]
}

const monthlyOverview: MonthlyOverviewData = {
  expense: '3,200.00',
  expenseTrend: { direction: 'down', value: '12.5%' },
  income: '5,000.00',
  incomeTrend: { direction: 'up', value: '8.3%' },
  balance: '1,800.00',
  balanceTrend: { direction: 'up', value: '20.4%' },
}

const periodSummaries: PeriodSummaryData[] = [
  { label: '今日', expense: '128.00', income: '500.00', icon: Sun },
  { label: '本周', expense: '860.00', income: '2,500.00', icon: CalendarRange },
]

const transactionGroups: TransactionGroup[] = [
  {
    label: '今天',
    date: '08 月 30 日',
    expense: '167.00',
    income: '500.00',
    transactions: [
      {
        id: 'today-lunch',
        category: '餐饮',
        detail: '午餐',
        account: '支付宝',
        time: '12:35',
        amount: '38.00',
        type: 'expense',
        icon: 'food',
        color: '#ff8047',
      },
      {
        id: 'today-subway',
        category: '交通',
        detail: '地铁',
        account: '支付宝',
        time: '08:15',
        amount: '30.00',
        type: 'expense',
        icon: 'transport',
        color: '#347df0',
      },
      {
        id: 'today-daily',
        category: '购物',
        detail: '日用',
        account: '微信',
        time: '09:42',
        amount: '99.00',
        type: 'expense',
        icon: 'shopping',
        color: '#41be5c',
      },
      {
        id: 'today-salary',
        category: '工资',
        account: '银行卡',
        time: '10:30',
        amount: '500.00',
        type: 'income',
        icon: 'finance',
        color: '#2778ed',
      },
    ],
  },
  {
    label: '昨天',
    date: '08 月 29 日',
    expense: '701.00',
    income: '2,000.00',
    transactions: [
      {
        id: 'yesterday-coffee',
        category: '餐饮',
        detail: '咖啡',
        account: '支付宝',
        time: '18:20',
        amount: '25.00',
        type: 'expense',
        icon: 'food',
        color: '#8850df',
      },
      {
        id: 'yesterday-clothes',
        category: '购物',
        detail: '服饰',
        account: '微信',
        time: '16:45',
        amount: '199.00',
        type: 'expense',
        icon: 'shopping',
        color: '#f7ae1d',
      },
      {
        id: 'yesterday-ride',
        category: '交通',
        detail: '打车',
        account: '支付宝',
        time: '14:10',
        amount: '27.00',
        type: 'expense',
        icon: 'transport',
        color: '#347df0',
      },
      {
        id: 'yesterday-side-job',
        category: '兼职收入',
        account: '银行卡',
        time: '11:05',
        amount: '2,000.00',
        type: 'income',
        icon: 'finance',
        color: '#2778ed',
      },
    ],
  },
]

const monthOptions = [
  '2025 年 8 月',
  '2025 年 7 月',
  '2025 年 6 月',
  '2025 年 5 月',
  '2025 年 4 月',
  '2025 年 3 月',
]

function formatAmount(transaction: Transaction) {
  return `${transaction.type === 'income' ? '+' : '-'}¥ ${transaction.amount}`
}

function TrendValue({ trend }: { trend: Trend }) {
  const Icon = trend.direction === 'up' ? ArrowUp : ArrowDown

  return (
    <span className={`trend-value trend-value--${trend.direction}`}>
      <span>较上月</span>
      <Icon aria-hidden="true" size={16} strokeWidth={2.6} />
      <span>{trend.value}</span>
    </span>
  )
}

function MonthSelector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const selectorRef = useRef<HTMLDivElement>(null)

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
        <span>{value}</span>
        <ChevronDown aria-hidden="true" size={20} strokeWidth={2.2} />
      </button>
      {isOpen && (
        <div className="month-selector__menu" role="listbox" aria-label="选择月份">
          {monthOptions.map((month) => (
            <button
              className={`month-selector__option${month === value ? ' is-selected' : ''}`}
              key={month}
              type="button"
              role="option"
              aria-selected={month === value}
              onClick={() => {
                onChange(month)
                setIsOpen(false)
              }}
            >
              {month}
              {month === value && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function MonthlyOverview() {
  return (
    <section className="overview-card" aria-labelledby="overview-title">
      <div className="overview-card__wash overview-card__wash--one" />
      <div className="overview-card__wash overview-card__wash--two" />
      <div className="overview-card__header">
        <div>
          <p className="section-kicker" id="overview-title">本月支出</p>
          <p className="overview-card__amount"><span>¥</span> {monthlyOverview.expense}</p>
          <TrendValue trend={monthlyOverview.expenseTrend} />
        </div>
        <button className="overview-card__chart" type="button" aria-label="查看收支图表">
          <ChartNoAxesColumnIncreasing aria-hidden="true" size={28} strokeWidth={2.1} />
        </button>
      </div>
      <div className="overview-card__secondary">
        <div className="overview-metric">
          <p>本月收入</p>
          <strong>¥ {monthlyOverview.income}</strong>
          <TrendValue trend={monthlyOverview.incomeTrend} />
        </div>
        <div className="overview-metric">
          <p>本月结余</p>
          <strong>¥ {monthlyOverview.balance}</strong>
          <TrendValue trend={monthlyOverview.balanceTrend} />
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
        <div>
          <span>支出</span>
          <strong>¥ {summary.expense}</strong>
        </div>
        <div>
          <span>收入</span>
          <strong className="is-income">¥ {summary.income}</strong>
        </div>
      </div>
    </button>
  )
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  return (
    <button className="transaction-row" type="button" aria-label={`查看${transaction.category}${transaction.detail ?? ''}`}>
      <span className="transaction-row__icon" style={{ backgroundColor: transaction.color }}>
        <CategoryIcon name={transaction.icon} size={28} color="#fff" />
      </span>
      <span className="transaction-row__description">
        <span className="transaction-row__name">
          {transaction.category}
          {transaction.detail && <><span className="transaction-row__dot">·</span>{transaction.detail}</>}
        </span>
        <span className="transaction-row__account">{transaction.account}</span>
      </span>
      <span className="transaction-row__time">{transaction.time}</span>
      <span className={`transaction-row__amount transaction-row__amount--${transaction.type}`}>
        {formatAmount(transaction)}
      </span>
    </button>
  )
}

function TransactionGroupView({ group }: { group: TransactionGroup }) {
  return (
    <section className="transaction-group" aria-labelledby={`group-${group.label}`}>
      <header className="transaction-group__header">
        <div>
          <h3 id={`group-${group.label}`}>{group.label}</h3>
          <span>{group.date}</span>
        </div>
        <p>
          <span>支出 ¥ {group.expense}</span>
          <span className="is-income">收入 ¥ {group.income}</span>
        </p>
      </header>
      <div className="transaction-group__list">
        {group.transactions.map((transaction) => (
          <TransactionRow key={transaction.id} transaction={transaction} />
        ))}
      </div>
    </section>
  )
}

function RecentTransactions({ onViewMore }: { onViewMore: () => void }) {
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
        {transactionGroups.map((group) => (
          <TransactionGroupView group={group} key={group.label} />
        ))}
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
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0])
  const toast = useToast()

  const handleUnavailableAction = (label: string) => {
    toast.info(`${label}功能开发中`)
  }

  const handleTabClick = (tabId: TabId) => {
    const labels: Record<TabId, string> = {
      home: '首页',
      chart: '图表',
      add: '记账',
      bill: '账单',
      profile: '我的',
    }
    if (tabId !== 'home') handleUnavailableAction(labels[tabId])
  }

  return (
    <div className="home-page">
      <main className="home-content">
        <Navbar
          title="首页"
          right={<MonthSelector value={selectedMonth} onChange={setSelectedMonth} />}
        />
        <MonthlyOverview />
        <section className="period-grid" aria-label="周期统计">
          {periodSummaries.map((summary) => (
            <PeriodSummaryCard key={summary.label} summary={summary} />
          ))}
        </section>
        <RecentTransactions onViewMore={() => navigate('/flow')} />
        <div className="home-scroll-spacer" aria-hidden="true" />
      </main>
      <Tabbar onTabClick={handleTabClick} />
    </div>
  )
}
