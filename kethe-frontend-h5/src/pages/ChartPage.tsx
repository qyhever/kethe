import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  WalletCards,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchAccounts,
  fetchCategoryReport,
  fetchTrend,
} from '../api/ledger'
import type {
  CategoryReport,
  CategoryReportItem,
  LedgerAccount,
  ReportView,
  TrendPoint,
} from '../api/types'
import { AccountSheet } from '../components/AccountSheet'
import { CategoryIcon } from '../components/CategoryIcon/CategoryIcon'
import { PeriodSheet, type PeriodOption } from '../components/PeriodSheet'
import { Tabbar, type TabId } from '../components/Tarbar'
import { useToast } from '../components/Toast'
import './ChartPage.css'

const ZONE = 'Asia/Shanghai'
const SERIES = [
  'var(--chart-series-1)',
  'var(--chart-series-2)',
  'var(--chart-series-3)',
  'var(--chart-series-4)',
  'var(--chart-series-5)',
]

type TransactionKind = 'expense' | 'income'
type SelectableReportView = Exclude<ReportView, 'custom'>

interface DateRange {
  startDate: string
  endDate: string
}

function shanghaiToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function dateParts(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return { year, month, day }
}

function dateKey(year: number, month: number, day: number) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function shiftDate(date: string, days: number) {
  const { year, month, day } = dateParts(date)
  const shifted = new Date(Date.UTC(year, month - 1, day + days))
  return dateKey(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
  )
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function isoWeekStart(year: number, week: number) {
  const januaryFourth = dateKey(year, 1, 4)
  const date = new Date(`${januaryFourth}T00:00:00Z`)
  const weekday = date.getUTCDay() || 7
  return shiftDate(januaryFourth, 1 - weekday + (week - 1) * 7)
}

function isoWeekForDate(date: string) {
  const value = new Date(`${date}T00:00:00Z`)
  const weekday = value.getUTCDay() || 7
  const monday = shiftDate(date, 1 - weekday)
  const thursday = new Date(`${shiftDate(date, 4 - weekday)}T00:00:00Z`)
  const year = thursday.getUTCFullYear()
  const firstMonday = isoWeekStart(year, 1)
  const week = Math.round(
    (Date.parse(`${monday}T00:00:00Z`) - Date.parse(`${firstMonday}T00:00:00Z`)) /
      (7 * 86400000),
  ) + 1
  return { year, week, monday, value: `${year}-W${String(week).padStart(2, '0')}` }
}

function createPeriodOptions(view: SelectableReportView, today: string): PeriodOption[] {
  if (view === 'week') {
    const current = isoWeekForDate(today)
    const options: PeriodOption[] = []
    for (
      let monday = isoWeekStart(2020, 1);
      monday <= current.monday;
      monday = shiftDate(monday, 7)
    ) {
      const period = isoWeekForDate(monday)
      const label =
        monday === current.monday
          ? '本周'
          : monday === shiftDate(current.monday, -7)
            ? '上周'
            : `${period.year === current.year ? '' : `${period.year}-`}${String(period.week).padStart(2, '0')}周`
      options.push({ value: period.value, label })
    }
    return options.reverse()
  }

  const currentYear = Number(today.slice(0, 4))
  if (view === 'year') {
    return Array.from({ length: currentYear - 2020 + 1 }, (_, index) => {
      const year = currentYear - index
      return {
        value: String(year),
        label: year === currentYear ? '今年' : year === currentYear - 1 ? '去年' : `${year}年`,
      }
    })
  }

  const currentMonth = Number(today.slice(5, 7))
  const currentIndex = currentYear * 12 + currentMonth - 1
  const firstIndex = 2020 * 12
  return Array.from({ length: currentIndex - firstIndex + 1 }, (_, index) => {
    const valueIndex = currentIndex - index
    const year = Math.floor(valueIndex / 12)
    const month = (valueIndex % 12) + 1
    const value = `${year}-${String(month).padStart(2, '0')}`
    return {
      value,
      label: index === 0 ? '本月' : index === 1 ? '上月' : `${year === currentYear ? '' : `${year}-`}${String(month).padStart(2, '0')}月`,
    }
  })
}

function toApiDate(date: string) {
  return new Date(`${date}T00:00:00+08:00`).toISOString()
}

function rangeForView(
  view: SelectableReportView,
  week: string,
  month: string,
  year: string,
): DateRange {
  if (view === 'year') return { startDate: `${year}-01-01`, endDate: `${year}-12-31` }
  if (view === 'week') {
    const [weekYear, weekNumber] = week.split('-W').map(Number)
    const startDate = isoWeekStart(weekYear, weekNumber)
    return { startDate, endDate: shiftDate(startDate, 6) }
  }
  const [monthYear, monthNumber] = month.split('-').map(Number)
  return {
    startDate: `${month}-01`,
    endDate: dateKey(monthYear, monthNumber, daysInMonth(monthYear, monthNumber)),
  }
}

function previousRange(view: SelectableReportView, range: DateRange): DateRange {
  if (view === 'week') {
    return {
      startDate: shiftDate(range.startDate, -7),
      endDate: shiftDate(range.endDate, -7),
    }
  }
  if (view === 'month') {
    const { year, month } = dateParts(range.startDate)
    const previous = new Date(Date.UTC(year, month - 2, 1))
    const y = previous.getUTCFullYear()
    const m = previous.getUTCMonth() + 1
    return {
      startDate: dateKey(y, m, 1),
      endDate: dateKey(y, m, daysInMonth(y, m)),
    }
  }
  if (view === 'year') {
    const year = Number(range.startDate.slice(0, 4)) - 1
    return { startDate: `${year}-01-01`, endDate: `${year}-12-31` }
  }
  return range
}

function formatCents(value: string | bigint) {
  const cents = typeof value === 'bigint' ? value : BigInt(value || '0')
  const absolute = cents < 0n ? -cents : cents
  const yuan = (absolute / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${cents < 0n ? '-' : ''}${yuan}.${(absolute % 100n).toString().padStart(2, '0')}`
}

function sumPoints(points: TrendPoint[], kind: TransactionKind) {
  return points.reduce(
    (total, point) => total + BigInt(kind === 'expense' ? point.expense : point.income),
    0n,
  )
}

function percentChange(current: bigint, previous: bigint) {
  if (previous === 0n) return null
  const difference = current - previous
  const absolute = difference < 0n ? -difference : difference
  return {
    direction: difference === 0n ? 'flat' : difference > 0n ? 'up' : 'down',
    percentage: Number((absolute * 1000n + previous / 2n) / previous) / 10,
  } as const
}

function periodLabel(period: string, view: ReportView) {
  if (view === 'year') return `${Number(period.slice(5))}月`
  const { month, day } = dateParts(period)
  return `${month}/${day}`
}

function LineChartView({
  points,
  kind,
  view,
}: {
  points: TrendPoint[]
  kind: TransactionKind
  view: SelectableReportView
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const values = points.map((point) =>
    BigInt(kind === 'expense' ? point.expense : point.income),
  )
  const maximum = values.reduce((max, value) => (value > max ? value : max), 0n)
  const numericMax = Math.max(Number(maximum), 1)
  const width = 620
  const height = 270
  const left = 44
  const top = 26
  const bottom = 38
  const plotWidth = width - left - 12
  const plotHeight = height - top - bottom
  const slot = plotWidth / Math.max(points.length - 1, 1)
  const labelEvery = Math.max(1, Math.ceil(points.length / 6))
  const coordinates = values.map((value, index) => ({
    x: points.length === 1 ? left + plotWidth / 2 : left + index * slot,
    y: top + plotHeight - (Number(value) / numericMax) * plotHeight,
  }))
  const handleKey = (event: KeyboardEvent<SVGCircleElement>, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelected(index)
    }
  }

  if (!points.length || maximum === 0n) {
    return <div className="chart-empty">当前范围暂无趋势数据</div>
  }

  return (
    <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${kind === 'expense' ? '支出' : '收入'}趋势折线图`}>
      {[0, 1, 2, 3].map((line) => {
        const y = top + (plotHeight / 3) * line
        const amount = BigInt(Math.round((numericMax * (3 - line)) / 3))
        return (
          <g key={line}>
            <line x1={left} x2={width - 12} y1={y} y2={y} className="trend-chart__grid" />
            <text x={left - 8} y={y + 4} textAnchor="end" className="trend-chart__axis">
              {amount >= 100000n ? `${Number(amount / 10000n) / 10}k` : formatCents(amount).replace('.00', '')}
            </text>
          </g>
        )
      })}
      <polyline
        className="trend-chart__line"
        points={coordinates.map(({ x, y }) => `${x},${y}`).join(' ')}
      />
      {points.map((point, index) => {
        const value = values[index]
        const { x, y } = coordinates[index]
        const isSelected = selected === index
        return (
          <g key={point.period}>
            <circle
              cx={x}
              cy={y}
              r={isSelected ? 7 : 5}
              className={`trend-chart__point${isSelected ? ' is-selected' : ''}`}
              role="button"
              tabIndex={0}
              aria-label={`${point.period}，${formatCents(value)}元`}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => handleKey(event, index)}
            />
            {(index % labelEvery === 0 || index === points.length - 1) && (
              <text x={x} y={height - 12} textAnchor="middle" className="trend-chart__axis">
                {periodLabel(point.period, view)}
              </text>
            )}
            {isSelected && (
              <g className="trend-chart__tooltip">
                <rect x={Math.max(4, Math.min(width - 132, x - 64))} y={Math.max(2, y - 55)} width="128" height="46" rx="10" />
                <text x={Math.max(68, Math.min(width - 68, x))} y={Math.max(19, y - 38)} textAnchor="middle">{periodLabel(point.period, view)}</text>
                <text x={Math.max(68, Math.min(width - 68, x))} y={Math.max(35, y - 22)} textAnchor="middle">¥ {formatCents(value)}</text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function Donut({ report, kind }: { report: CategoryReport; kind: TransactionKind }) {
  const items = report.list
  let cursor = 0
  const stops = items.map((item, index) => {
    const start = cursor
    cursor += item.percentage
    const color = item.iconColor ?? SERIES[index % SERIES.length]
    return `${color} ${start}% ${cursor}%`
  })
  const style = {
    '--donut-fill': stops.length ? `conic-gradient(${stops.join(',')})` : 'var(--color-fill)',
  } as CSSProperties
  return (
    <div className="category-composition">
      <div className="donut" style={style}>
        <div className="donut__center">
          <strong>¥ {formatCents(report.total)}</strong>
          <span>总{kind === 'expense' ? '支出' : '收入'}</span>
        </div>
      </div>
      <div className="category-legend">
        {items.map((item, index) => (
          <div className="category-legend__item" key={item.categoryId}>
            <i style={{ background: item.iconColor ?? SERIES[index % SERIES.length] }} />
            <span>{item.categoryName}</span>
            <strong>{item.percentage.toFixed(1)}%</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChartPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const today = useMemo(shanghaiToday, [])
  const currentWeek = useMemo(() => isoWeekForDate(today).value, [today])
  const [kind, setKind] = useState<TransactionKind>('expense')
  const [view, setView] = useState<SelectableReportView>('month')
  const [week, setWeek] = useState(currentWeek)
  const [month, setMonth] = useState(today.slice(0, 7))
  const [year, setYear] = useState(today.slice(0, 4))
  const [periodOpen, setPeriodOpen] = useState(false)
  const [accountId, setAccountId] = useState<string>()
  const [accounts, setAccounts] = useState<LedgerAccount[]>([])
  const [accountOpen, setAccountOpen] = useState(false)
  const [points, setPoints] = useState<TrendPoint[]>([])
  const [previousPoints, setPreviousPoints] = useState<TrendPoint[]>([])
  const [categories, setCategories] = useState<CategoryReport>({ total: '0', list: [] })
  const [parent, setParent] = useState<CategoryReportItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  const range = useMemo(
    () => rangeForView(view, week, month, year),
    [month, view, week, year],
  )
  const priorRange = useMemo(() => previousRange(view, range), [range, view])
  const periodOptions = useMemo(
    () => createPeriodOptions(view, today),
    [today, view],
  )
  const selectedPeriod = view === 'week' ? week : view === 'month' ? month : year
  const selectedPeriodLabel =
    periodOptions.find((option) => option.value === selectedPeriod)?.label ?? selectedPeriod
  const accountName = accounts.find((item) => item.id === accountId)?.name ?? '全部账户'

  useEffect(() => {
    const controller = new AbortController()
    fetchAccounts()
      .then((items) => setAccounts(items.filter((item) => item.isEnabled)))
      .catch(() => {
        if (!controller.signal.aborted) toast.error('账户列表加载失败')
      })
    return () => controller.abort()
  }, [toast])

  useEffect(() => {
    setParent(null)
  }, [accountId, kind, month, view, week, year])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    const commonRange = {
      startTime: toApiDate(range.startDate),
      endTime: toApiDate(shiftDate(range.endDate, 1)),
      accountId,
    }
    const currentQuery =
      view === 'week'
        ? { view, week, accountId }
        : view === 'month'
          ? { view, month, accountId }
          : { view, year, accountId }
    Promise.all([
      fetchTrend(currentQuery, controller.signal),
      fetchTrend(
        {
          view: 'custom',
          startTime: toApiDate(priorRange.startDate),
          endTime: toApiDate(shiftDate(priorRange.endDate, 1)),
          accountId,
        },
        controller.signal,
      ),
      fetchCategoryReport(
        {
          transactionType: kind === 'expense' ? 1 : 2,
          ...commonRange,
          parentCategoryId: parent?.categoryId,
        },
        controller.signal,
      ),
    ])
      .then(([current, previous, categoryReport]) => {
        setPoints(current.points)
        setPreviousPoints(previous.points)
        setCategories(categoryReport)
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(reason instanceof Error ? reason.message : '图表数据加载失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [accountId, kind, month, parent, priorRange, range, retryKey, view, week, year])

  const total = sumPoints(points, kind)
  const previousTotal = sumPoints(previousPoints, kind)
  const trend = percentChange(total, previousTotal)
  const compareLabel = view === 'week' ? '较上周' : view === 'month' ? '较上月' : '较上年'

  const openFlow = (categoryId?: string) =>
    navigate('/flow', {
      state: {
        returnTo: '/chart',
        flowFilters: {
          ...range,
          type: kind,
          accountId,
          categoryId,
        },
      },
    })

  const openRankingFlow = (categoryId: string) => {
    const search = new URLSearchParams({
      ...range,
      type: kind,
      categoryId,
    })
    if (accountId) search.set('accountId', accountId)
    navigate(`/flow?${search.toString()}`, { state: { returnTo: '/chart' } })
  }

  const handleTab = (tab: TabId) => {
    if (tab === 'chart') return
    if (tab === 'home') return navigate('/home')
    if (tab === 'add') return navigate('/tally')
    if (tab === 'bill') return navigate('/bill')
    toast.info('我的功能开发中')
  }

  return (
    <div className="chart-page">
      <main className="chart-content">
        <header className="chart-header">
          <h1>图表</h1>
          <div className="chart-header__filters">
            <div className="chart-segment" aria-label="收支类型">
              {(['expense', 'income'] as const).map((item) => (
                <button key={item} type="button" className={kind === item ? 'is-active' : ''} onClick={() => setKind(item)}>
                  {item === 'expense' ? '支出' : '收入'}
                </button>
              ))}
            </div>
            <button className="account-trigger" type="button" onClick={() => setAccountOpen(true)}>
              <WalletCards aria-hidden="true" size={17} />
              <span>{accountName}</span>
              <ChevronDown aria-hidden="true" size={16} />
            </button>
          </div>
          <div className="period-segment" aria-label="统计周期">
            {([['week', '周'], ['month', '月'], ['year', '年']] as const).map(([value, label]) => (
              <button key={value} className={view === value ? 'is-active' : ''} type="button" onClick={() => { setView(value); setPeriodOpen(false) }}>{label}</button>
            ))}
          </div>
          <div className="date-controls">
            <button type="button" onClick={() => setPeriodOpen(true)}>
              {selectedPeriodLabel}<ChevronDown aria-hidden="true" size={16} />
            </button>
          </div>
        </header>

        {loading && <div className="chart-skeleton" role="status" aria-label="正在加载图表"><i /><i /><i /></div>}
        {!loading && error && (
          <div className="chart-state chart-state--error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => setRetryKey((value) => value + 1)}><RefreshCw size={17} />重新加载</button>
          </div>
        )}
        {!loading && !error && (
          <>
            <section className="trend-card">
              <p>{kind === 'expense' ? '支出' : '收入'}总额</p>
              <strong className="trend-card__amount">¥ {formatCents(total)}</strong>
              <div className={`trend-change trend-change--${trend?.direction ?? 'none'}`}>
                <span>{compareLabel}</span>
                {!trend ? <span>--</span> : <>{trend.direction === 'up' ? <ArrowUp size={15} /> : trend.direction === 'down' ? <ArrowDown size={15} /> : null}<span>{trend.percentage.toFixed(1)}%</span></>}
              </div>
              <div className="trend-card__visual">
                <LineChartView points={points} kind={kind} view={view} />
              </div>
            </section>

            <section className="chart-card category-card">
              <header>
                <div>
                  {parent && <button className="category-back" type="button" onClick={() => setParent(null)}><ArrowLeft size={17} />返回</button>}
                  <h2>{parent ? `${parent.categoryName}明细` : `${kind === 'expense' ? '支出' : '收入'}分类占比`}</h2>
                </div>
                <button type="button" onClick={() => openFlow()}><span>查看详情</span><ChevronRight size={17} /></button>
              </header>
              {categories.list.length ? <Donut report={categories} kind={kind} /> : <div className="chart-empty">当前范围暂无分类数据</div>}
            </section>

            <section className="chart-card ranking-card">
              <header>
                <h2>{kind === 'expense' ? '支出' : '收入'}排行榜</h2>
                <button type="button" onClick={() => openFlow()}><span>查看全部</span><ChevronRight size={17} /></button>
              </header>
              {categories.list.length ? (
                <ol>
                  {categories.list.map((item, index) => (
                    <li key={item.categoryId}>
                      <button type="button" onClick={() => openRankingFlow(item.categoryId)}>
                        <span className={`ranking-number${index === 0 ? ' is-first' : ''}`}>{index + 1}</span>
                        <span className="ranking-icon" style={{ color: item.iconColor ?? 'var(--color-brand)' }}><CategoryIcon name={item.iconKey ?? 'other'} svgContent={item.svgContent} size={22} /></span>
                        <span className="ranking-main">
                          <span className="ranking-line"><strong>{item.categoryName}</strong><span>¥ {formatCents(item.amount)}</span><small>{item.percentage.toFixed(1)}%</small>{item.hasChildren && !parent && <ChevronRight size={15} />}</span>
                          <span className="ranking-progress"><i style={{ width: `${Math.max(2, item.percentage)}%` }} /></span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              ) : <div className="chart-empty">暂无排行数据</div>}
            </section>
          </>
        )}
      </main>
      <Tabbar activeTab="chart" onTabClick={handleTab} />

      <AccountSheet
        open={accountOpen}
        accounts={[{ id: undefined, name: '全部账户' }, ...accounts]}
        selectedId={accountId}
        onClose={() => setAccountOpen(false)}
        onSelect={(account) => {
          setAccountId(account.id)
          setAccountOpen(false)
        }}
      />
      <PeriodSheet
        open={periodOpen}
        title={`选择${view === 'week' ? '周' : view === 'month' ? '月' : '年'}`}
        options={periodOptions}
        selectedValue={selectedPeriod}
        onClose={() => setPeriodOpen(false)}
        onSelect={(option) => {
          if (view === 'week') setWeek(option.value)
          else if (view === 'month') setMonth(option.value)
          else setYear(option.value)
          setPeriodOpen(false)
        }}
      />
    </div>
  )
}
