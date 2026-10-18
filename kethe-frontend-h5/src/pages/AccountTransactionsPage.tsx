import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchAccountTransactions } from '../api/ledger'
import type { AccountTransactionsReport } from '../api/types'
import { AccountHeader, AccountIcon } from '../components/Account/AccountUI'
import { PeriodSheet } from '../components/PeriodSheet'
import './AccountSettingsPage.css'
import './ChartPage.css'
import './AccountTransactionsPage.css'

export function AccountTransactionsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useSearchParams()
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const currentMonth = today.slice(0, 7)
  const currentYear = today.slice(0, 4)
  const validMonth = (value: string | null) =>
    value &&
    /^20\d{2}-(0[1-9]|1[0-2])$/.test(value) &&
    value >= '2020-01' &&
    value <= currentMonth
  const month = validMonth(search.get('month'))
    ? search.get('month')!
    : currentMonth
  const savedYear = search.get('year')
  const year =
    savedYear &&
    /^20\d{2}$/.test(savedYear) &&
    savedYear >= '2020' &&
    savedYear <= currentYear
      ? savedYear
      : month.slice(0, 4)
  const view = search.get('view') === 'year' ? 'year' : 'month'
  const source = search.get('source') === 'accounts' ? 'accounts' : 'chart'
  const [open, setOpen] = useState(false)
  const [report, setReport] = useState<AccountTransactionsReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const update = (changes: Record<string, string>) =>
    setSearch(
      { view, month, ...(savedYear ? { year } : {}), source, ...changes },
      { replace: true },
    )
  const options =
    view === 'year'
      ? Array.from({ length: Number(currentYear) - 2019 }, (_, index) => ({
          value: String(Number(currentYear) - index),
          label: `${Number(currentYear) - index}年`,
        }))
      : Array.from(
          {
            length:
              (Number(currentYear) - 2020) * 12 + Number(currentMonth.slice(5)),
          },
          (_, index) => {
            const value =
              Number(currentYear) * 12 +
              Number(currentMonth.slice(5)) -
              1 -
              index
            const monthValue = `${Math.floor(value / 12)}-${String((value % 12) + 1).padStart(2, '0')}`
            return {
              value: monthValue,
              label: `${monthValue.slice(0, 4)}年${Number(monthValue.slice(5))}月`,
            }
          },
        )

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    fetchAccountTransactions(
      view === 'month' ? { view, month } : { view, year },
      controller.signal,
    )
      .then((result) => {
        if (!controller.signal.aborted) setReport(result)
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(reason instanceof Error ? reason.message : '统计加载失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [view, month, year, retry])

  const openFlow = (accountId: string) => {
    const y = Number(view === 'year' ? year : month.slice(0, 4))
    const m = view === 'year' ? 12 : Number(month.slice(5))
    const endDate = `${y}-${String(m).padStart(2, '0')}-${new Date(Date.UTC(y, m, 0)).getUTCDate()}`
    navigate('/flow', {
      state: {
        returnTo: '/chart/account-transactions',
        returnSearch: `?${new URLSearchParams({ view, month, year, source })}`,
        flowFilters: {
          accountId,
          startDate: view === 'year' ? `${year}-01-01` : `${month}-01`,
          endDate,
          type: 'all',
        },
      },
    })
  }

  return (
    <main className="account-page account-transactions-page">
      <AccountHeader
        title="账户交易笔数"
        onBack={() =>
          navigate(source === 'accounts' ? '/profile/accounts' : '/chart')
        }
      />
      <div className="account-transactions-content">
        <div className="period-segment" aria-label="统计周期">
          {(['month', 'year'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={view === value}
              className={view === value ? 'is-active' : ''}
              onClick={() => {
                update({ view: value, ...(value === 'year' ? { year } : {}) })
                setOpen(false)
              }}
            >
              {value === 'month' ? '月' : '年'}
            </button>
          ))}
        </div>
        <div className="date-controls">
          <button type="button" onClick={() => setOpen(true)}>
            {view === 'month'
              ? `${month.slice(0, 4)}年${Number(month.slice(5))}月`
              : `${year}年`}
            <ChevronDown size={16} />
          </button>
        </div>
        {loading ? (
          <div
            className="chart-skeleton"
            role="status"
            aria-label="正在加载统计"
          >
            <i />
            <i />
          </div>
        ) : error ? (
          <div className="chart-state" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setRetry((value) => value + 1)}
            >
              <RefreshCw size={16} />
              重试
            </button>
          </div>
        ) : (
          report && (
            <>
              <section className="account-transactions-summary">
                <span>账户交易合计</span>
                <strong>
                  {report.totalCount.toLocaleString()}
                  <small> 笔</small>
                </strong>
                <div>
                  有交易账户数 <b>{report.activeAccountCount}</b>
                </div>
                <p>转账双方各计一笔</p>
              </section>
              {report.list.length === 0 ? (
                <div className="chart-state">还没有账户</div>
              ) : (
                <>
                  {report.totalCount === 0 && (
                    <p className="account-transactions-empty" role="status">
                      所选周期暂无交易
                    </p>
                  )}
                  <div className="account-transactions-list">
                    {report.list.map((account) => (
                      <button
                        type="button"
                        className="account-transactions-row"
                        key={account.accountId}
                        onClick={() => openFlow(account.accountId)}
                      >
                        <span className="account-transactions-identity">
                          <AccountIcon iconKey={account.iconKey} nature={1} />
                          <strong>{account.accountName}</strong>
                          {!account.isEnabled && <small>已停用</small>}
                          <b>{account.totalCount.toLocaleString()} 笔</b>
                          <ChevronRight size={16} />
                        </span>
                        <span className="account-transactions-detail">
                          {(
                            [
                              ['支出', account.expenseCount],
                              ['收入', account.incomeCount],
                              ['转出', account.transferOutCount],
                              ['转入', account.transferInCount],
                            ] as const
                          ).map(([label, count]) => (
                            <span key={label}>
                              {label}
                              <b>{count.toLocaleString()}</b>
                            </span>
                          ))}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )
        )}
      </div>
      <PeriodSheet
        open={open}
        title={view === 'month' ? '选择月份' : '选择年份'}
        options={options}
        selectedValue={view === 'month' ? month : year}
        onSelect={(option) => {
          update({ [view]: option.value })
          setOpen(false)
        }}
        onClose={() => setOpen(false)}
      />
    </main>
  )
}
