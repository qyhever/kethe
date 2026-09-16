import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  PieChart,
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
import { DatePicker } from '../components/DatePicker'
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
type ChartKind = 'bar' | 'pie'
type DateSide = 'start' | 'end'

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

function toApiDate(date: string) {
  return new Date(`${date}T00:00:00+08:00`).toISOString()
}

function rangeForView(
  view: ReportView,
  month: string,
  year: string,
  custom: DateRange,
): DateRange {
  if (view === 'custom') return custom
  if (view === 'year') return { startDate: `${year}-01-01`, endDate: `${year}-12-31` }
  const [monthYear, monthNumber] = month.split('-').map(Number)
  return {
    startDate: `${month}-01`,
    endDate: dateKey(monthYear, monthNumber, daysInMonth(monthYear, monthNumber)),
  }
}

function previousRange(view: ReportView, range: DateRange): DateRange {
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
  const start = Date.UTC(...([
    dateParts(range.startDate).year,
    dateParts(range.startDate).month - 1,
    dateParts(range.startDate).day,
  ] as [number, number, number]))
  const end = Date.UTC(...([
    dateParts(range.endDate).year,
    dateParts(range.endDate).month - 1,
    dateParts(range.endDate).day,
  ] as [number, number, number]))
  const days = Math.round((end - start) / 86400000) + 1
  return {
    startDate: shiftDate(range.startDate, -days),
    endDate: shiftDate(range.startDate, -1),
  }
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

function BarChartView({
  points,
  kind,
  view,
}: {
  points: TrendPoint[]
  kind: TransactionKind
  view: ReportView
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
  const slot = plotWidth / Math.max(points.length, 1)
  const barWidth = Math.max(4, Math.min(20, slot * 0.62))
  const labelEvery = Math.max(1, Math.ceil(points.length / 6))
  const selectBar = (index: number) => setSelected(index)
  const handleKey = (event: KeyboardEvent<SVGRectElement>, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectBar(index)
    }
  }

  if (!points.length || maximum === 0n) {
    return <div className="chart-empty">当前范围暂无趋势数据</div>
  }

  return (
    <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${kind === 'expense' ? '支出' : '收入'}趋势柱状图`}>
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
      {points.map((point, index) => {
        const value = values[index]
        const barHeight = Math.max(value > 0n ? 3 : 0, (Number(value) / numericMax) * plotHeight)
        const x = left + index * slot + (slot - barWidth) / 2
        const y = top + plotHeight - barHeight
        const isSelected = selected === index
        return (
          <g key={point.period}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={barWidth / 2}
              className={`trend-chart__bar${isSelected ? ' is-selected' : ''}`}
              role="button"
              tabIndex={0}
              aria-label={`${point.period}，${formatCents(value)}元`}
              onClick={() => selectBar(index)}
              onKeyDown={(event) => handleKey(event, index)}
            />
            {(index % labelEvery === 0 || index === points.length - 1) && (
              <text x={x + barWidth / 2} y={height - 12} textAnchor="middle" className="trend-chart__axis">
                {periodLabel(point.period, view)}
              </text>
            )}
            {isSelected && (
              <g className="trend-chart__tooltip">
                <rect x={Math.max(4, Math.min(width - 132, x - 52))} y={Math.max(2, y - 55)} width="128" height="46" rx="10" />
                <text x={Math.max(68, Math.min(width - 68, x + barWidth / 2))} y={Math.max(19, y - 38)} textAnchor="middle">{periodLabel(point.period, view)}</text>
                <text x={Math.max(68, Math.min(width - 68, x + barWidth / 2))} y={Math.max(35, y - 22)} textAnchor="middle">¥ {formatCents(value)}</text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function displayCategories(list: CategoryReportItem[]) {
  if (list.length <= 5) return list
  const first = list.slice(0, 5)
  const rest = list.slice(5)
  const amount = rest.reduce((sum, item) => sum + BigInt(item.amount), 0n)
  return [
    ...first,
    {
      categoryId: 'other',
      categoryName: '其他',
      amount: amount.toString(),
      percentage: rest.reduce((sum, item) => sum + item.percentage, 0),
      iconKey: 'other',
      svgContent: null,
      iconColor: null,
      hasChildren: false,
    },
  ]
}

function Donut({ report, kind }: { report: CategoryReport; kind: TransactionKind }) {
  const items = displayCategories(report.list)
  let cursor = 0
  const stops = items.map((item, index) => {
    const start = cursor
    cursor += item.percentage
    const color = index === 5 ? 'var(--chart-series-other)' : SERIES[index % SERIES.length]
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
            <i style={{ background: index === 5 ? 'var(--chart-series-other)' : SERIES[index % SERIES.length] }} />
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
  const [kind, setKind] = useState<TransactionKind>('expense')
  const [view, setView] = useState<ReportView>('month')
  const [month, setMonth] = useState(today.slice(0, 7))
  const [year, setYear] = useState(today.slice(0, 4))
  const [custom, setCustom] = useState<DateRange>({ startDate: shiftDate(today, -6), endDate: today })
  const [dateSide, setDateSide] = useState<DateSide | null>(null)
  const [accountId, setAccountId] = useState<string>()
  const [accounts, setAccounts] = useState<LedgerAccount[]>([])
  const [accountOpen, setAccountOpen] = useState(false)
  const [chartKind, setChartKind] = useState<ChartKind>('bar')
  const [points, setPoints] = useState<TrendPoint[]>([])
  const [previousPoints, setPreviousPoints] = useState<TrendPoint[]>([])
  const [categories, setCategories] = useState<CategoryReport>({ total: '0', list: [] })
  const [parent, setParent] = useState<CategoryReportItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  const range = useMemo(
    () => rangeForView(view, month, year, custom),
    [custom, month, view, year],
  )
  const priorRange = useMemo(() => previousRange(view, range), [range, view])
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
  }, [accountId, kind, month, view, year, custom.startDate, custom.endDate])

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
      view === 'month'
        ? { view, month, accountId }
        : view === 'year'
          ? { view, year, accountId }
          : { view, ...commonRange }
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
  }, [accountId, kind, month, parent, priorRange, range, retryKey, view, year])

  const total = sumPoints(points, kind)
  const previousTotal = sumPoints(previousPoints, kind)
  const trend = percentChange(total, previousTotal)
  const compareLabel = view === 'month' ? '较上月' : view === 'year' ? '较上年' : '较上期'

  const openFlow = (categoryId?: string) =>
    navigate('/flow', {
      state: {
        chartFilters: {
          ...range,
          type: kind,
          accountId,
          categoryId,
        },
      },
    })

  const handleTab = (tab: TabId) => {
    if (tab === 'chart') return
    if (tab === 'home') return navigate('/home')
    if (tab === 'add') return navigate('/tally')
    if (tab === 'bill') return navigate('/flow')
    toast.info('我的功能开发中')
  }

  const chooseCustomDate = (value: string) => {
    if (dateSide === 'start') {
      setCustom((current) => ({ startDate: value, endDate: value > current.endDate ? value : current.endDate }))
    } else {
      setCustom((current) => ({ startDate: value < current.startDate ? value : current.startDate, endDate: value }))
    }
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
            {([['month', '月'], ['year', '年'], ['custom', '自定义']] as const).map(([value, label]) => (
              <button key={value} className={view === value ? 'is-active' : ''} type="button" onClick={() => setView(value)}>{label}</button>
            ))}
          </div>
          <div className="date-controls">
            {view === 'month' && <input aria-label="选择月份" type="month" value={month} onChange={(event) => event.target.value && setMonth(event.target.value)} />}
            {view === 'year' && <input aria-label="选择年份" type="number" min="1900" max="9999" value={year} onChange={(event) => /^\d{4}$/.test(event.target.value) && setYear(event.target.value)} />}
            {view === 'custom' && (
              <>
                <button type="button" onClick={() => setDateSide('start')}><CalendarDays size={16} />{custom.startDate}</button>
                <span>至</span>
                <button type="button" onClick={() => setDateSide('end')}><CalendarDays size={16} />{custom.endDate}</button>
              </>
            )}
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
                {chartKind === 'bar' ? <BarChartView points={points} kind={kind} view={view} /> : categories.list.length ? <Donut report={categories} kind={kind} /> : <div className="chart-empty">当前范围暂无分类数据</div>}
              </div>
              <div className="chart-kind-switch">
                <button className={chartKind === 'bar' ? 'is-active' : ''} type="button" onClick={() => setChartKind('bar')}><BarChart3 size={18} />柱状图</button>
                <button className={chartKind === 'pie' ? 'is-active' : ''} type="button" onClick={() => setChartKind('pie')}><PieChart size={18} />饼图</button>
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
                  {categories.list.slice(0, 5).map((item, index) => (
                    <li key={item.categoryId}>
                      <button type="button" onClick={() => item.hasChildren && !parent ? setParent(item) : openFlow(item.categoryId)}>
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
      {dateSide && <DatePicker label={dateSide === 'start' ? '选择开始日期' : '选择结束日期'} value={dateSide === 'start' ? custom.startDate : custom.endDate} onChange={chooseCustomDate} onClose={() => setDateSide(null)} />}
    </div>
  )
}
