import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchYearlyBill } from '../api/ledger'
import type { BillMonthSummary, YearlyBill } from '../api/types'
import { PeriodSheet, type PeriodOption } from '../components/PeriodSheet'
import { Tabbar, type TabId } from '../components/Tarbar'
import './BillPage.css'

const ZONE = 'Asia/Shanghai'
const MONTHS = Array.from({ length: 12 }, (_, index) => 12 - index)

function currentShanghaiYear() {
  return new Intl.DateTimeFormat('en', {
    timeZone: ZONE,
    year: 'numeric',
  }).format(new Date())
}

function formatCents(value: string) {
  let cents: bigint
  try {
    cents = BigInt(value)
  } catch {
    cents = 0n
  }
  const negative = cents < 0n
  const absolute = negative ? -cents : cents
  const yuan = (absolute / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const fraction = (absolute % 100n).toString().padStart(2, '0')
  return `${negative ? '-' : ''}¥${yuan}.${fraction}`
}

function isNegative(value: string) {
  try {
    return BigInt(value) < 0n
  } catch {
    return false
  }
}

function monthPeriod(year: string, month: number) {
  return `${year}-${month.toString().padStart(2, '0')}`
}

function lastDayOfMonth(year: string, month: number) {
  return new Date(Date.UTC(Number(year), month, 0)).getUTCDate()
}

function amountClass(value: string) {
  return formatCents(value).length > 13 ? ' is-long' : ''
}

function BillSkeleton() {
  return (
    <div className="bill-skeleton" aria-label="正在加载年度账单" role="status">
      <div className="bill-skeleton__summary" />
      <div className="bill-skeleton__table">
        <i />
        {MONTHS.map((month) => <i key={month} />)}
      </div>
    </div>
  )
}

export function BillPage() {
  const navigate = useNavigate()
  const thisYear = useMemo(currentShanghaiYear, [])
  const yearOptions = useMemo<PeriodOption[]>(
    () => Array.from({ length: 10 }, (_, index) => {
      const value = String(Number(thisYear) - index)
      return { value, label: `${value}年` }
    }),
    [thisYear],
  )
  const [year, setYear] = useState(thisYear)
  const [yearSheetOpen, setYearSheetOpen] = useState(false)
  const [data, setData] = useState<YearlyBill | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    setData(null)
    fetchYearlyBill(year, controller.signal)
      .then(setData)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : '年度账单加载失败')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [retryKey, year])

  const monthMap = useMemo(
    () => new Map((data?.months ?? []).map((month) => [month.period, month])),
    [data],
  )

  const openMonth = (month: number) => {
    const period = monthPeriod(year, month)
    navigate('/flow', {
      state: {
        returnTo: '/bill',
        flowFilters: {
          startDate: `${period}-01`,
          endDate: `${period}-${lastDayOfMonth(year, month)}`,
          type: 'all',
        },
      },
    })
  }

  const handleTab = (tab: TabId) => {
    if (tab === 'bill') return
    if (tab === 'home') return navigate('/home')
    if (tab === 'chart') return navigate('/chart')
    if (tab === 'add') return navigate('/tally', { state: { returnTo: '/bill' } })
    navigate('/profile')
  }

  return (
    <div className="bill-page">
      <main className="bill-content">
        <header className="bill-header">
          <button
            className="bill-year-select"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={yearSheetOpen}
            onClick={() => setYearSheetOpen(true)}
          >
            <span>{year}年</span>
            <ChevronDown aria-hidden="true" size={18} strokeWidth={2.3} />
          </button>
          <h1>账单</h1>
          <span className="bill-header__balance" aria-hidden="true" />
        </header>

        {loading && <BillSkeleton />}

        {!loading && error && (
          <section className="bill-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => setRetryKey((key) => key + 1)}>
              <RefreshCw aria-hidden="true" size={17} />
              重新加载
            </button>
          </section>
        )}

        {!loading && data && (
          <div className="bill-loaded">
            <section className="bill-summary" aria-label={`${year}年汇总`}>
              <div className="bill-summary__primary">
                <span>本年结余</span>
                <strong className={amountClass(data.balance)} title={formatCents(data.balance)}>
                  {formatCents(data.balance)}
                </strong>
              </div>
              <div className="bill-summary__metrics">
                <div>
                  <span>本年收入</span>
                  <strong className={`is-income${amountClass(data.income)}`} title={formatCents(data.income)}>
                    {formatCents(data.income)}
                  </strong>
                </div>
                <div>
                  <span>本年支出</span>
                  <strong className={amountClass(data.expense)} title={formatCents(data.expense)}>
                    {formatCents(data.expense)}
                  </strong>
                </div>
              </div>
              <div className="bill-summary__bars" aria-hidden="true">
                <i /><i /><i />
              </div>
            </section>

            <section className="bill-months" aria-label={`${year}年月度账单`}>
              <div className="bill-months__header" aria-hidden="true">
                <span>月份</span><span>月收入</span><span>月支出</span><span>月结余</span><i />
              </div>
              <div className="bill-months__body">
                {MONTHS.map((month) => {
                  const summary: BillMonthSummary = monthMap.get(monthPeriod(year, month)) ?? {
                    period: monthPeriod(year, month),
                    income: '0',
                    expense: '0',
                  }
                  const balance = (BigInt(summary.income) - BigInt(summary.expense)).toString()
                  return (
                    <button
                      className="bill-month-row"
                      type="button"
                      key={month}
                      aria-label={`${month}月，收入${formatCents(summary.income)}，支出${formatCents(summary.expense)}，结余${formatCents(balance)}，查看流水`}
                      onClick={() => openMonth(month)}
                    >
                      <span>{month.toString().padStart(2, '0')}月</span>
                      <span className={amountClass(summary.income)} title={formatCents(summary.income)}>{formatCents(summary.income)}</span>
                      <span className={amountClass(summary.expense)} title={formatCents(summary.expense)}>{formatCents(summary.expense)}</span>
                      <span className={`bill-month-row__balance${isNegative(balance) ? ' is-negative' : ''}${amountClass(balance)}`} title={formatCents(balance)}>{formatCents(balance)}</span>
                      <ChevronRight aria-hidden="true" size={18} strokeWidth={1.8} />
                    </button>
                  )
                })}
              </div>
            </section>
          </div>
        )}
      </main>
      <Tabbar activeTab="bill" onTabClick={handleTab} />
      <PeriodSheet
        open={yearSheetOpen}
        title="选择年份"
        options={yearOptions}
        selectedValue={year}
        onClose={() => setYearSheetOpen(false)}
        onSelect={(option) => {
          setYear(option.value)
          setYearSheetOpen(false)
        }}
      />
    </div>
  )
}
