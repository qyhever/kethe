import {
  ArrowLeft,
  CalendarDays,
  CirclePlus,
  CreditCard,
  LayoutGrid,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchAccounts,
  fetchCategories,
  fetchTransactions,
} from '../api/ledger'
import type {
  LedgerAccount,
  LedgerCategory,
  LedgerTransaction,
  TransactionQuery,
} from '../api/types'
import { CategoryIcon } from '../components/CategoryIcon/CategoryIcon'
import { useToast } from '../components/Toast'
import './FlowPage.css'

type FlowType = 'all' | 'expense' | 'income' | 'transfer'
interface Filters {
  type: FlowType
  startDate: string
  endDate: string
  categoryId: string
  accountId: string
  minimum: string
  maximum: string
}
interface CategoryOption {
  id: string
  label: string
  type: 1 | 2
  isChild: boolean
}
interface FlowGroup {
  date: string
  income: bigint
  expense: bigint
  list: LedgerTransaction[]
}

const ZONE = 'Asia/Shanghai'
const PAGE_SIZE = 20
const DEFAULT_ICON_COLOR = '#64748b'
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const EMPTY_FILTERS: Filters = {
  type: 'all',
  startDate: '',
  endDate: '',
  categoryId: '',
  accountId: '',
  minimum: '',
  maximum: '',
}
const flowTypes: Array<{ id: FlowType; label: string; apiValue?: 1 | 2 | 3 }> =
  [
    { id: 'all', label: '全部' },
    { id: 'expense', label: '支出', apiValue: 1 },
    { id: 'income', label: '收入', apiValue: 2 },
    { id: 'transfer', label: '转账', apiValue: 3 },
  ]

function formatCents(value: string | bigint) {
  const text = String(value)
  if (!/^-?\d+$/.test(text)) return '--'
  const cents = BigInt(text)
  const absolute = cents < 0n ? -cents : cents
  const yuan = (absolute / 100n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${cents < 0n ? '-' : ''}${yuan}.${(absolute % 100n).toString().padStart(2, '0')}`
}

function yuanToCents(value: string) {
  const [yuan, fraction = ''] = value.split('.')
  return `${yuan}${fraction.padEnd(2, '0')}`.replace(/^0+(?=\d)/, '')
}

function shanghaiDateKey(value: string | Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function previousDateKey() {
  const today = shanghaiDateKey(new Date())
  for (let hours = 24; hours <= 48; hours += 24) {
    const candidate = shanghaiDateKey(
      new Date(Date.now() - hours * 60 * 60 * 1000),
    )
    if (candidate !== today) return candidate
  }
  return ''
}

function groupHeading(date: string) {
  const [, month, day] = date.split('-')
  const detail = `${Number(month)} 月 ${Number(day)} 日`
  const weekday = WEEKDAYS[new Date(`${date}T12:00:00+08:00`).getUTCDay()]
  if (date === shanghaiDateKey(new Date()))
    return { label: '今天', detail, weekday }
  if (date === previousDateKey()) return { label: '昨天', detail, weekday }
  return { label: detail, detail: '', weekday }
}

function transactionTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

function nextShanghaiDay(date: string) {
  const next = new Date(`${date}T00:00:00Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  return next.toISOString().slice(0, 10)
}

function buildQuery(
  filters: Filters,
  keyword: string,
  currentPage: number,
): TransactionQuery {
  return {
    currentPage,
    pageSize: PAGE_SIZE,
    startTime: filters.startDate
      ? new Date(`${filters.startDate}T00:00:00+08:00`).toISOString()
      : undefined,
    endTime: filters.endDate
      ? new Date(
          `${nextShanghaiDay(filters.endDate)}T00:00:00+08:00`,
        ).toISOString()
      : undefined,
    transactionType: flowTypes.find((item) => item.id === filters.type)
      ?.apiValue,
    categoryId: filters.categoryId || undefined,
    accountId: filters.accountId || undefined,
    minAmount: filters.minimum ? yuanToCents(filters.minimum) : undefined,
    maxAmount: filters.maximum ? yuanToCents(filters.maximum) : undefined,
    keyword: keyword || undefined,
  }
}

function flattenCategories(categories: LedgerCategory[]) {
  return categories.flatMap<CategoryOption>((category) => [
    {
      id: category.id,
      label: category.name,
      type: category.categoryType,
      isChild: false,
    },
    ...category.children.map((child) => ({
      id: child.id,
      label: child.name,
      type: child.categoryType,
      isChild: true,
    })),
  ])
}

function groupTransactions(items: LedgerTransaction[]) {
  const groups = new Map<string, FlowGroup>()
  for (const item of items) {
    const date = shanghaiDateKey(item.transactionTime)
    const group = groups.get(date) ?? {
      date,
      income: 0n,
      expense: 0n,
      list: [],
    }
    group.list.push(item)
    if (item.transactionType === 1) group.expense += BigInt(item.amount)
    if (item.transactionType === 2) group.income += BigInt(item.amount)
    groups.set(date, group)
  }
  return [...groups.values()]
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
    : transaction.accountName || '未知账户'
  const prefix =
    transaction.transactionType === 1
      ? '-'
      : transaction.transactionType === 2
        ? '+'
        : ''
  return (
    <div className="flow-row">
      <span
        className="flow-row__icon"
        style={{ backgroundColor: transaction.iconColor || DEFAULT_ICON_COLOR }}
      >
        <CategoryIcon
          name={transaction.iconKey || 'other'}
          svgContent={transaction.svgContent}
          size={26}
          color="#fff"
        />
      </span>
      <span className="flow-row__copy">
        <strong>
          {category}
          {detail && (
            <>
              <i>·</i>
              {detail}
            </>
          )}
        </strong>
        <small>
          {transaction.remark?.trim() || '无备注'} · {account}
        </small>
      </span>
      <span className="flow-row__value">
        <strong
          className={
            transaction.transactionType === 2
              ? 'is-income'
              : isTransfer
                ? 'is-transfer'
                : undefined
          }
        >
          {prefix}¥{formatCents(transaction.amount)}
        </strong>
        <small>{transactionTime(transaction.transactionTime)}</small>
      </span>
    </div>
  )
}

function FilterSheet({
  draft,
  categories,
  accounts,
  optionsLoading,
  optionsError,
  onChange,
  onClose,
  onReset,
  onApply,
  onRetryOptions,
}: {
  draft: Filters
  categories: CategoryOption[]
  accounts: LedgerAccount[]
  optionsLoading: boolean
  optionsError: string | null
  onChange: (next: Filters) => void
  onClose: () => void
  onReset: () => void
  onApply: () => void
  onRetryOptions: () => void
}) {
  const sheetRef = useRef<HTMLElement>(null)
  const selectedApiType = flowTypes.find(
    (item) => item.id === draft.type,
  )?.apiValue
  const visibleCategories = categories.filter(
    (item) => !selectedApiType || item.type === selectedApiType,
  )
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
  const changeType = (type: FlowType) => {
    const apiType = flowTypes.find((item) => item.id === type)?.apiValue
    const category = categories.find((item) => item.id === draft.categoryId)
    const categoryId =
      apiType === 3 || (category && apiType && category.type !== apiType)
        ? ''
        : draft.categoryId
    onChange({ ...draft, type, categoryId })
  }
  return (
    <div
      className="flow-filter"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="flow-filter__sheet"
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-title"
        tabIndex={-1}
      >
        <header className="flow-filter__header">
          <h2 id="filter-title">筛选</h2>
          <button type="button" onClick={onReset}>
            重置
          </button>
        </header>
        <div className="filter-field filter-field--date">
          <div className="filter-field__title">
            <CalendarDays aria-hidden="true" size={24} />
            <strong>日期范围</strong>
          </div>
          <div className="filter-date-inputs">
            <label>
              开始日期
              <input
                type="date"
                value={draft.startDate}
                onChange={(event) =>
                  onChange({ ...draft, startDate: event.target.value })
                }
              />
            </label>
            <span>–</span>
            <label>
              结束日期
              <input
                type="date"
                value={draft.endDate}
                onChange={(event) =>
                  onChange({ ...draft, endDate: event.target.value })
                }
              />
            </label>
          </div>
        </div>
        <div className="filter-field filter-field--types">
          <div className="filter-field__title">
            <SlidersHorizontal aria-hidden="true" size={24} />
            <strong>流水类型</strong>
          </div>
          <div className="filter-type-grid" aria-label="流水类型">
            {flowTypes.map((type) => (
              <button
                className={draft.type === type.id ? 'is-active' : undefined}
                key={type.id}
                type="button"
                aria-pressed={draft.type === type.id}
                onClick={() => changeType(type.id)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
        <label className="filter-field filter-field--select">
          <span className="filter-field__title">
            <LayoutGrid aria-hidden="true" size={24} />
            <strong>分类</strong>
          </span>
          <select
            aria-label="分类"
            disabled={draft.type === 'transfer' || optionsLoading}
            value={draft.categoryId}
            onChange={(event) =>
              onChange({ ...draft, categoryId: event.target.value })
            }
          >
            <option value="">全部分类</option>
            {visibleCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.isChild ? `　${category.label}` : category.label}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field filter-field--select">
          <span className="filter-field__title">
            <CreditCard aria-hidden="true" size={24} />
            <strong>账户</strong>
          </span>
          <select
            aria-label="账户"
            disabled={optionsLoading}
            value={draft.accountId}
            onChange={(event) =>
              onChange({ ...draft, accountId: event.target.value })
            }
          >
            <option value="">全部账户</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
        {optionsLoading && (
          <p className="filter-options-state" role="status">
            正在加载分类和账户…
          </p>
        )}
        {optionsError && (
          <div className="filter-options-state is-error">
            <span>{optionsError}</span>
            <button type="button" onClick={onRetryOptions}>
              重试
            </button>
          </div>
        )}
        <div className="filter-field filter-field--amount">
          <div className="filter-field__title">
            <span className="filter-yen" aria-hidden="true">
              ¥
            </span>
            <strong>金额范围</strong>
          </div>
          <div className="filter-amount-inputs">
            <input
              inputMode="decimal"
              aria-label="最低金额"
              placeholder="最低金额"
              value={draft.minimum}
              onChange={(event) =>
                onChange({ ...draft, minimum: event.target.value })
              }
            />
            <span>–</span>
            <input
              inputMode="decimal"
              aria-label="最高金额"
              placeholder="最高金额"
              value={draft.maximum}
              onChange={(event) =>
                onChange({ ...draft, maximum: event.target.value })
              }
            />
          </div>
        </div>
        <div className="flow-filter__footer">
          <button type="button" onClick={onApply}>
            应用筛选
          </button>
        </div>
      </section>
    </div>
  )
}

export function FlowPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [items, setItems] = useState<LedgerTransaction[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [initialError, setInitialError] = useState<string | null>(null)
  const [moreError, setMoreError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [accounts, setAccounts] = useState<LedgerAccount[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [optionsRetryKey, setOptionsRetryKey] = useState(0)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef<AbortController | null>(null)
  const generationRef = useRef(0)
  const loadingMoreRef = useRef(false)

  useEffect(() => {
    if (!search.trim()) {
      setDebouncedSearch('')
      return
    }
    const timeout = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      300,
    )
    return () => window.clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    let active = true
    setOptionsLoading(true)
    setOptionsError(null)
    Promise.all([fetchCategories(1), fetchCategories(2), fetchAccounts()])
      .then(([expense, income, accountList]) => {
        if (active) {
          setCategories(flattenCategories([...expense, ...income]))
          setAccounts(accountList)
        }
      })
      .catch((reason: unknown) => {
        if (active)
          setOptionsError(
            reason instanceof Error ? reason.message : '筛选选项加载失败',
          )
      })
      .finally(() => {
        if (active) setOptionsLoading(false)
      })
    return () => {
      active = false
    }
  }, [optionsRetryKey])

  useEffect(
    () => () => {
      generationRef.current += 1
      requestRef.current?.abort()
    },
    [],
  )

  useEffect(() => {
    const controller = new AbortController()
    requestRef.current?.abort()
    requestRef.current = controller
    const generation = ++generationRef.current
    loadingMoreRef.current = false
    setItems([])
    setTotal(0)
    setCurrentPage(0)
    setInitialLoading(true)
    setInitialError(null)
    setMoreError(null)
    fetchTransactions(
      buildQuery(filters, debouncedSearch, 1),
      controller.signal,
    )
      .then((result) => {
        if (generation === generationRef.current) {
          setItems(result.list)
          setTotal(result.total)
          setCurrentPage(result.currentPage)
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted && generation === generationRef.current)
          setInitialError(
            reason instanceof Error ? reason.message : '流水加载失败',
          )
      })
      .finally(() => {
        if (!controller.signal.aborted && generation === generationRef.current)
          setInitialLoading(false)
      })
    return () => controller.abort()
  }, [filters, debouncedSearch, retryKey])

  const loadMore = useCallback(
    (force = false) => {
      if (
        initialLoading ||
        loadingMoreRef.current ||
        (!force && moreError) ||
        items.length >= total
      )
        return
      loadingMoreRef.current = true
      setLoadingMore(true)
      setMoreError(null)
      const controller = new AbortController()
      requestRef.current = controller
      const generation = generationRef.current
      fetchTransactions(
        buildQuery(filters, debouncedSearch, currentPage + 1),
        controller.signal,
      )
        .then((result) => {
          if (generation !== generationRef.current) return
          setItems((current) => {
            const ids = new Set(current.map((item) => item.id))
            return [
              ...current,
              ...result.list.filter((item) => !ids.has(item.id)),
            ]
          })
          setTotal(result.total)
          setCurrentPage(result.currentPage)
          setMoreError(null)
        })
        .catch((reason: unknown) => {
          if (
            !controller.signal.aborted &&
            generation === generationRef.current
          )
            setMoreError(
              reason instanceof Error ? reason.message : '加载更多失败',
            )
        })
        .finally(() => {
          if (generation === generationRef.current) {
            loadingMoreRef.current = false
            setLoadingMore(false)
          }
        })
    },
    [
      currentPage,
      debouncedSearch,
      filters,
      initialLoading,
      items.length,
      moreError,
      total,
    ],
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: '240px 0px' },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  const groups = useMemo(() => groupTransactions(items), [items])
  const changeMainType = (type: FlowType) =>
    setFilters((current) => {
      const apiType = flowTypes.find((item) => item.id === type)?.apiValue
      const category = categories.find((item) => item.id === current.categoryId)
      return {
        ...current,
        type,
        categoryId:
          apiType === 3 || (category && apiType && category.type !== apiType)
            ? ''
            : current.categoryId,
      }
    })
  const applyFilters = () => {
    const pattern = /^(0|[1-9]\d*)(\.\d{1,2})?$/
    if (draft.startDate && draft.endDate && draft.startDate > draft.endDate)
      return toast.error('开始日期不能晚于结束日期')
    if (
      (draft.minimum && !pattern.test(draft.minimum)) ||
      (draft.maximum && !pattern.test(draft.maximum))
    )
      return toast.error('金额须为非负数，且最多保留两位小数')
    if (
      draft.minimum &&
      draft.maximum &&
      BigInt(yuanToCents(draft.minimum)) > BigInt(yuanToCents(draft.maximum))
    )
      return toast.error('最低金额不能大于最高金额')
    setFilters({ ...draft })
    setIsFilterOpen(false)
  }
  const resetAll = () => {
    setFilters({ ...EMPTY_FILTERS })
    setDraft({ ...EMPTY_FILTERS })
    setSearch('')
  }

  return (
    <div className="flow-page">
      <main className="flow-content">
        <header className="flow-navbar">
          <button
            className="flow-navbar__back"
            type="button"
            aria-label="返回首页"
            onClick={() => navigate('/home')}
          >
            <ArrowLeft aria-hidden="true" size={27} />
          </button>
          {isSearching ? (
            <div className="flow-search">
              <Search aria-hidden="true" size={19} />
              <input
                autoFocus
                aria-label="搜索流水"
                placeholder="搜索备注、分类、账户"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button
                type="button"
                aria-label="关闭搜索"
                onClick={() => {
                  setSearch('')
                  setIsSearching(false)
                }}
              >
                <X size={19} />
              </button>
            </div>
          ) : (
            <h1>流水</h1>
          )}
          <div className="flow-navbar__actions">
            {!isSearching && (
              <button
                type="button"
                aria-label="搜索流水"
                onClick={() => setIsSearching(true)}
              >
                <Search aria-hidden="true" size={27} />
              </button>
            )}
            <button
              type="button"
              aria-label="打开筛选"
              aria-expanded={isFilterOpen}
              onClick={() => {
                setDraft({ ...filters })
                setIsFilterOpen(true)
              }}
            >
              <SlidersHorizontal aria-hidden="true" size={27} />
            </button>
            <button
              type="button"
              aria-label="新增流水"
              onClick={() => toast.info('记账功能开发中')}
            >
              <CirclePlus aria-hidden="true" size={29} />
            </button>
          </div>
        </header>
        <nav className="flow-type-tabs" aria-label="流水类型">
          {flowTypes.map((type) => (
            <button
              className={filters.type === type.id ? 'is-active' : undefined}
              key={type.id}
              type="button"
              aria-current={filters.type === type.id ? 'page' : undefined}
              onClick={() => changeMainType(type.id)}
            >
              {type.label}
            </button>
          ))}
        </nav>
        <div className="flow-list">
          {initialLoading && (
            <div className="flow-state" role="status">
              正在加载流水…
            </div>
          )}
          {!initialLoading && initialError && (
            <div className="flow-state flow-state--error" role="alert">
              <p>{initialError}</p>
              <button
                type="button"
                onClick={() => setRetryKey((key) => key + 1)}
              >
                <RefreshCw size={17} />
                重新加载
              </button>
            </div>
          )}
          {!initialLoading &&
            !initialError &&
            groups.map((group) => {
              const heading = groupHeading(group.date)
              return (
                <section
                  className="flow-group"
                  key={group.date}
                  aria-labelledby={`flow-group-${group.date}`}
                >
                  <header className="flow-group__header">
                    <div>
                      <h2 id={`flow-group-${group.date}`}>{heading.label}</h2>
                      {heading.detail && <span>{heading.detail}</span>}
                      <span>{heading.weekday}</span>
                    </div>
                    <p>
                      <span>支出 ¥{formatCents(group.expense)}</span>
                      <span>收入 ¥{formatCents(group.income)}</span>
                    </p>
                  </header>
                  <div className="flow-group__rows">
                    {group.list.map((transaction) => (
                      <TransactionRow
                        transaction={transaction}
                        key={transaction.id}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          {!initialLoading && !initialError && items.length === 0 && (
            <div className="flow-empty">
              <Search size={30} />
              <p>没有找到符合条件的流水</p>
              <button type="button" onClick={resetAll}>
                清除筛选
              </button>
            </div>
          )}
          {!initialLoading && !initialError && items.length > 0 && (
            <div className="flow-load-more" ref={sentinelRef}>
              {loadingMore && <span role="status">正在加载更多…</span>}
              {moreError && (
                <>
                  <span>{moreError}</span>
                  <button type="button" onClick={() => loadMore(true)}>
                    重试
                  </button>
                </>
              )}
              {!loadingMore && !moreError && items.length >= total && (
                <span>已加载全部 {total} 条流水</span>
              )}
            </div>
          )}
        </div>
      </main>
      {isFilterOpen && (
        <FilterSheet
          draft={draft}
          categories={categories}
          accounts={accounts}
          optionsLoading={optionsLoading}
          optionsError={optionsError}
          onChange={setDraft}
          onClose={() => setIsFilterOpen(false)}
          onReset={() => setDraft({ ...EMPTY_FILTERS })}
          onApply={applyFilters}
          onRetryOptions={() => setOptionsRetryKey((key) => key + 1)}
        />
      )}
    </div>
  )
}
