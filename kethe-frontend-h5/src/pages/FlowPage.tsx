import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CirclePlus,
  CreditCard,
  LayoutGrid,
  Minus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  TransactionYearSummary,
} from '../api/types'
import { CategoryIcon } from '../components/CategoryIcon/CategoryIcon'
import { DatePicker } from '../components/DatePicker'
import { useToast } from '../components/Toast'
import './FlowPage.css'

type FlowType = 'all' | 'expense' | 'income' | 'transfer'
type DatePreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'last7Days'
  | 'last30Days'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisYear'
  | 'lastYear'
  | 'custom'
interface Filters {
  type: FlowType
  datePreset: DatePreset
  startDate: string
  endDate: string
  categoryIds: string[]
  accountIds: string[]
  minimum: string
  maximum: string
}
interface FlowMonthGroup {
  month: string
  list: LedgerTransaction[]
}
interface FlowYearGroup {
  year: string
  months: FlowMonthGroup[]
}

const ZONE = 'Asia/Shanghai'
const DEFAULT_ICON_COLOR = '#64748b'
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const EMPTY_FILTERS: Filters = {
  type: 'all',
  datePreset: 'all',
  startDate: '',
  endDate: '',
  categoryIds: [],
  accountIds: [],
  minimum: '',
  maximum: '',
}

function currentYearFilters(): Filters {
  const year = new Intl.DateTimeFormat('en', {
    timeZone: ZONE,
    year: 'numeric',
  }).format(new Date())
  return {
    ...EMPTY_FILTERS,
    datePreset: 'thisYear',
    startDate: `${year}-01-01`,
    endDate: `${year}-12-31`,
  }
}

const datePresetGroups: Array<
  Array<{ id: Exclude<DatePreset, 'custom'>; label: string }>
> = [
  [{ id: 'all', label: '全部' }],
  [
    { id: 'today', label: '今天' },
    { id: 'yesterday', label: '昨天' },
    { id: 'last7Days', label: '近 7 天' },
    { id: 'last30Days', label: '近 30 天' },
  ],
  [
    { id: 'thisWeek', label: '本周' },
    { id: 'lastWeek', label: '上周' },
    { id: 'thisMonth', label: '本月' },
    { id: 'lastMonth', label: '上月' },
    { id: 'thisQuarter', label: '本季' },
    { id: 'lastQuarter', label: '上季' },
    { id: 'thisYear', label: '本年' },
    { id: 'lastYear', label: '去年' },
  ],
]
const datePresetLabels = new Map<DatePreset, string>([
  ...datePresetGroups.flat().map(({ id, label }) => [id, label] as const),
  ['custom', '自定义'],
])

function dateFromParts(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, '0')}-${month
    .toString()
    .padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

function dateParts(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return { year, month, day }
}

function shiftDate(date: string, days: number) {
  const { year, month, day } = dateParts(date)
  const value = new Date(Date.UTC(year, month - 1, day + days))
  return dateFromParts(
    value.getUTCFullYear(),
    value.getUTCMonth() + 1,
    value.getUTCDate(),
  )
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function endOfMonth(year: number, month: number) {
  return dateFromParts(year, month, daysInMonth(year, month))
}

function presetRange(preset: Exclude<DatePreset, 'custom'>, now = new Date()) {
  const today = shanghaiDateKey(now)
  const { year, month } = dateParts(today)
  if (preset === 'all') return { startDate: '', endDate: '' }
  if (preset === 'today') return { startDate: today, endDate: today }
  if (preset === 'yesterday') {
    const yesterday = shiftDate(today, -1)
    return { startDate: yesterday, endDate: yesterday }
  }
  if (preset === 'last7Days') {
    return { startDate: shiftDate(today, -6), endDate: today }
  }
  if (preset === 'last30Days') {
    return { startDate: shiftDate(today, -29), endDate: today }
  }
  if (preset === 'thisWeek' || preset === 'lastWeek') {
    const weekday = new Date(`${today}T12:00:00+08:00`).getUTCDay()
    const monday = shiftDate(today, -(weekday === 0 ? 6 : weekday - 1))
    const startDate = preset === 'lastWeek' ? shiftDate(monday, -7) : monday
    return { startDate, endDate: shiftDate(startDate, 6) }
  }
  if (preset === 'thisMonth') {
    return {
      startDate: dateFromParts(year, month, 1),
      endDate: endOfMonth(year, month),
    }
  }
  if (preset === 'lastMonth') {
    const previous = new Date(Date.UTC(year, month - 2, 1))
    const previousYear = previous.getUTCFullYear()
    const previousMonth = previous.getUTCMonth() + 1
    return {
      startDate: dateFromParts(previousYear, previousMonth, 1),
      endDate: endOfMonth(previousYear, previousMonth),
    }
  }
  if (preset === 'thisQuarter' || preset === 'lastQuarter') {
    let quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1
    let quarterYear = year
    if (preset === 'lastQuarter') {
      quarterStartMonth -= 3
      if (quarterStartMonth < 1) {
        quarterStartMonth += 12
        quarterYear -= 1
      }
    }
    return {
      startDate: dateFromParts(quarterYear, quarterStartMonth, 1),
      endDate: endOfMonth(quarterYear, quarterStartMonth + 2),
    }
  }
  const targetYear = preset === 'lastYear' ? year - 1 : year
  return {
    startDate: `${targetYear}-01-01`,
    endDate: `${targetYear}-12-31`,
  }
}

function formatDateSummary(filters: Filters) {
  if (filters.datePreset !== 'custom') {
    return datePresetLabels.get(filters.datePreset) ?? '全部'
  }
  const format = (date: string) => (date ? date.replaceAll('-', '.') : '不限')
  return `${format(filters.startDate)} – ${format(filters.endDate)}`
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

function transactionDate(value: string) {
  const date = shanghaiDateKey(value)
  return {
    day: date.slice(8, 10),
    weekday: WEEKDAYS[new Date(`${date}T12:00:00+08:00`).getUTCDay()],
  }
}

function transactionTime(value: string) {
  const date = new Date(value)
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: ZONE,
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(date),
  )
  const time = new Intl.DateTimeFormat('zh-CN', {
    timeZone: ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
  return `${hour < 12 ? '上午' : '下午'} ${time}`
}

function nextShanghaiDay(date: string) {
  const next = new Date(`${date}T00:00:00Z`)
  next.setUTCDate(next.getUTCDate() + 1)
  return next.toISOString().slice(0, 10)
}

function buildQuery(
  filters: Filters,
  keyword: string,
): TransactionQuery {
  return {
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
    categoryIds: filters.categoryIds,
    accountIds: filters.accountIds,
    minAmount: filters.minimum ? yuanToCents(filters.minimum) : undefined,
    maxAmount: filters.maximum ? yuanToCents(filters.maximum) : undefined,
    keyword: keyword || undefined,
  }
}

function categoryIds(category: LedgerCategory) {
  return [category.id, ...category.children.map((child) => child.id)]
}

function selectedCategoryLabels(
  selectedIds: string[],
  categories: LedgerCategory[],
) {
  const selected = new Set(selectedIds)
  return categories.flatMap((category) => {
    const ids = categoryIds(category)
    if (ids.every((id) => selected.has(id))) return [category.name]
    const labels: string[] = []
    if (selected.has(category.id)) labels.push(category.name)
    for (const child of category.children) {
      if (selected.has(child.id)) labels.push(child.name)
    }
    return labels
  })
}

function selectionSummary(labels: string[], allLabel: string) {
  if (!labels.length) return allLabel
  return `${labels.slice(0, 2).join('、')}${labels.length > 2 ? '…' : ''}`
}

function groupTransactions(items: LedgerTransaction[]) {
  const years = new Map<string, Map<string, FlowMonthGroup>>()
  for (const item of items) {
    const date = shanghaiDateKey(item.transactionTime)
    const yearKey = date.slice(0, 4)
    const monthKey = date.slice(0, 7)
    const months = years.get(yearKey) ?? new Map<string, FlowMonthGroup>()
    const month = months.get(monthKey) ?? { month: monthKey, list: [] }
    month.list.push(item)
    months.set(monthKey, month)
    years.set(yearKey, months)
  }
  return [...years].map<FlowYearGroup>(([year, months]) => ({
    year,
    months: [...months.values()],
  }))
}

function TransactionRow({
  transaction,
  onClick,
}: {
  transaction: LedgerTransaction
  onClick: () => void
}) {
  const date = transactionDate(transaction.transactionTime)
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
    <button className="flow-row" type="button" onClick={onClick}>
      <span className="flow-row__date" aria-label={`${date.day}日 ${date.weekday}`}>
        <strong>{date.day}</strong>
        <small>{date.weekday}</small>
      </span>
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
        <strong>{category}{detail ? ` · ${detail}` : ''}</strong>
        <small className="flow-row__subject">
          {transaction.remark?.trim() || '无备注'}
        </small>
        <small>{transactionTime(transaction.transactionTime)} · {account}</small>
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
      </span>
    </button>
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
  categories: LedgerCategory[]
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
  const [drawer, setDrawer] = useState<'date' | 'category' | 'account' | null>(
    null,
  )
  const [customDateSide, setCustomDateSide] = useState<'start' | 'end' | null>(
    null,
  )
  const [lastDatePreset, setLastDatePreset] = useState<
    Exclude<DatePreset, 'custom'>
  >(draft.datePreset === 'custom' ? 'thisYear' : draft.datePreset)
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(categories.map((category) => category.id)),
  )
  const selectedApiType = flowTypes.find(
    (item) => item.id === draft.type,
  )?.apiValue
  const visibleCategories = categories.filter(
    (item) => !selectedApiType || item.categoryType === selectedApiType,
  )
  const categoryLabels = selectedCategoryLabels(
    draft.categoryIds,
    visibleCategories,
  )
  const accountNames = accounts
    .filter((account) => draft.accountIds.includes(account.id))
    .map((account) => account.name)
  const customDateKey =
    customDateSide === 'start' ? 'startDate' : 'endDate'
  const customDate = customDateSide ? draft[customDateKey] : ''
  const customDateLabel = customDateSide === 'start' ? '开始日期' : '结束日期'
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    sheetRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (customDateSide) setCustomDateSide(null)
        else if (drawer) setDrawer(null)
        else onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [customDateSide, drawer, onClose])
  const changeType = (type: FlowType) => {
    const apiType = flowTypes.find((item) => item.id === type)?.apiValue
    const validIds = new Set(
      categories
        .filter((category) => !apiType || category.categoryType === apiType)
        .flatMap(categoryIds),
    )
    onChange({
      ...draft,
      type,
      categoryIds:
        apiType === 3
          ? []
          : draft.categoryIds.filter((id) => validIds.has(id)),
    })
  }
  const toggleId = (ids: string[], selectedIds: string[]) => {
    const selected = new Set(selectedIds)
    const shouldSelect = !ids.every((id) => selected.has(id))
    for (const id of ids) {
      if (shouldSelect) selected.add(id)
      else selected.delete(id)
    }
    return [...selected]
  }
  const toggleCategoryChild = (
    category: LedgerCategory,
    childId: string,
  ) => {
    const selected = new Set(toggleId([childId], draft.categoryIds))
    if (
      category.children.length > 0 &&
      category.children.every((child) => selected.has(child.id))
    ) {
      selected.add(category.id)
    } else {
      selected.delete(category.id)
    }
    return [...selected]
  }
  const renderMark = (checked: boolean, partial = false) => (
    <span
      className={`filter-check${checked || partial ? ' is-checked' : ''}`}
      aria-hidden="true"
    >
      {partial ? <Minus size={14} /> : checked ? <Check size={14} /> : null}
    </span>
  )
  const allVisibleCategoryIds = visibleCategories.flatMap(categoryIds)
  const allCategoriesSelected =
    allVisibleCategoryIds.length > 0 &&
    allVisibleCategoryIds.every((id) => draft.categoryIds.includes(id))
  const allAccountsSelected =
    accounts.length > 0 &&
    accounts.every((account) => draft.accountIds.includes(account.id))
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
        <button
          className="filter-field filter-field--select filter-field--date"
          type="button"
          aria-haspopup="dialog"
          onClick={() => setDrawer('date')}
        >
          <span className="filter-field__title">
            <CalendarDays aria-hidden="true" size={24} />
            <strong>日期范围</strong>
          </span>
          <span className="filter-field__summary">
            {formatDateSummary(draft)}
            <ChevronRight size={18} />
          </span>
        </button>
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
        <button
          className="filter-field filter-field--select"
          type="button"
          disabled={
            draft.type === 'transfer' || optionsLoading || !!optionsError
          }
          onClick={() => setDrawer('category')}
        >
          <span className="filter-field__title">
            <LayoutGrid aria-hidden="true" size={24} />
            <strong>分类</strong>
          </span>
          <span className="filter-field__summary">
            {selectionSummary(categoryLabels, '全部分类')}
            <ChevronRight size={18} />
          </span>
        </button>
        <button
          className="filter-field filter-field--select"
          type="button"
          disabled={optionsLoading || !!optionsError}
          onClick={() => setDrawer('account')}
        >
          <span className="filter-field__title">
            <CreditCard aria-hidden="true" size={24} />
            <strong>账户</strong>
          </span>
          <span className="filter-field__summary">
            {selectionSummary(accountNames, '全部账户')}
            <ChevronRight size={18} />
          </span>
        </button>
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
        {drawer && (
          <section
            className="filter-picker"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-picker-title"
          >
            <header className="filter-picker__header">
              <button
                type="button"
                aria-label="返回筛选"
                onClick={() => {
                  setCustomDateSide(null)
                  setDrawer(null)
                }}
              >
                <ArrowLeft size={23} />
              </button>
              <h3 id="filter-picker-title">
                {drawer === 'date'
                  ? '日期范围'
                  : drawer === 'category'
                    ? '选择分类'
                    : '选择账户'}
              </h3>
              <span aria-hidden="true" />
            </header>
            {drawer === 'date' ? (
              <div className="date-picker__content">
                {datePresetGroups.map((group, groupIndex) => (
                  <div className="date-preset-group" key={groupIndex}>
                    {group.map((preset) => {
                      const selected = draft.datePreset === preset.id
                      return (
                        <button
                          className="date-preset-row"
                          type="button"
                          key={preset.id}
                          role="radio"
                          aria-checked={selected}
                          onClick={() => {
                            onChange({
                              ...draft,
                              datePreset: preset.id,
                              ...presetRange(preset.id),
                            })
                            setLastDatePreset(preset.id)
                            setCustomDateSide(null)
                          }}
                        >
                          <span>{preset.label}</span>
                          {selected && (
                            <Check
                              className="date-preset-row__check"
                              aria-hidden="true"
                              size={20}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
                <div className="date-preset-group date-custom">
                  <button
                    className="date-preset-row"
                    type="button"
                    role="switch"
                    aria-checked={draft.datePreset === 'custom'}
                    onClick={() => {
                      if (draft.datePreset === 'custom') {
                        onChange({
                          ...draft,
                          datePreset: lastDatePreset,
                          ...presetRange(lastDatePreset),
                        })
                        setCustomDateSide(null)
                      } else {
                        setLastDatePreset(draft.datePreset)
                        onChange({ ...draft, datePreset: 'custom' })
                        setCustomDateSide('start')
                      }
                    }}
                  >
                    <span>自定义</span>
                    <i
                      className={`date-custom-toggle${draft.datePreset === 'custom' ? ' is-active' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                  {draft.datePreset === 'custom' && (
                    <div className="date-custom__body">
                      {(['start', 'end'] as const).map((side) => {
                        const key = side === 'start' ? 'startDate' : 'endDate'
                        const date = draft[key]
                        const label = side === 'start' ? '开始日期' : '结束日期'
                        return (
                          <div className="date-custom__section" key={side}>
                            <div className="date-custom__heading">
                              <button
                                className="date-custom__date"
                                type="button"
                                aria-haspopup="dialog"
                                aria-expanded={customDateSide === side}
                                aria-controls={`date-picker-popup-${side}`}
                                disabled={!date}
                                onClick={() =>
                                  setCustomDateSide((current) =>
                                    current === side ? null : side,
                                  )
                                }
                              >
                                <span>{label}</span>
                                <strong>
                                  {date ? date.replaceAll('-', ' / ') : '不限'}
                                </strong>
                                {date && <ChevronDown size={17} />}
                              </button>
                              <button
                                className={`date-unlimited${!date ? ' is-active' : ''}`}
                                type="button"
                                role="switch"
                                aria-checked={!date}
                                aria-label={`${label}不限`}
                                onClick={() => {
                                  const nextDate = date
                                    ? ''
                                    : shanghaiDateKey(new Date())
                                  onChange({ ...draft, [key]: nextDate })
                                  setCustomDateSide(date ? null : side)
                                }}
                              >
                                <span>不限</span>
                                <i aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
            <div className="filter-picker__list">
              <button
                className="filter-picker__row filter-picker__all"
                type="button"
                onClick={() =>
                  onChange({
                    ...draft,
                    [drawer === 'category' ? 'categoryIds' : 'accountIds']:
                      drawer === 'category'
                        ? allCategoriesSelected
                          ? []
                          : allVisibleCategoryIds
                        : allAccountsSelected
                          ? []
                          : accounts.map((account) => account.id),
                  })
                }
              >
                <strong>全选</strong>
                {renderMark(
                  drawer === 'category'
                    ? allCategoriesSelected
                    : allAccountsSelected,
                )}
              </button>
              {drawer === 'category'
                ? visibleCategories.map((category) => {
                    const ids = categoryIds(category)
                    const selectedCount = ids.filter((id) =>
                      draft.categoryIds.includes(id),
                    ).length
                    const checked = selectedCount === ids.length
                    const partial = selectedCount > 0 && !checked
                    const isExpanded = expanded.has(category.id)
                    return (
                      <div className="filter-category" key={category.id}>
                        <div className="filter-picker__row filter-category__parent">
                          <button
                            type="button"
                            className="filter-category__expand"
                            aria-label={`${isExpanded ? '收起' : '展开'}${category.name}`}
                            aria-expanded={isExpanded}
                            onClick={() =>
                              setExpanded((current) => {
                                const next = new Set(current)
                                if (next.has(category.id)) next.delete(category.id)
                                else next.add(category.id)
                                return next
                              })
                            }
                          >
                            {isExpanded ? (
                              <ChevronDown size={19} />
                            ) : (
                              <ChevronRight size={19} />
                            )}
                          </button>
                          <button
                            type="button"
                            className="filter-category__select"
                            onClick={() =>
                              onChange({
                                ...draft,
                                categoryIds: toggleId(ids, draft.categoryIds),
                              })
                            }
                          >
                            <strong>{category.name}</strong>
                            {renderMark(checked, partial)}
                          </button>
                        </div>
                        {isExpanded &&
                          category.children.map((child) => {
                            const childChecked = draft.categoryIds.includes(
                              child.id,
                            )
                            return (
                              <button
                                className="filter-picker__row filter-category__child"
                                type="button"
                                key={child.id}
                                onClick={() =>
                                  onChange({
                                    ...draft,
                                    categoryIds: toggleCategoryChild(
                                      category,
                                      child.id,
                                    ),
                                  })
                                }
                              >
                                <span>{child.name}</span>
                                {renderMark(childChecked)}
                              </button>
                            )
                          })}
                      </div>
                    )
                  })
                : accounts.map((account) => {
                    const checked = draft.accountIds.includes(account.id)
                    return (
                      <button
                        className="filter-picker__row"
                        type="button"
                        key={account.id}
                        onClick={() =>
                          onChange({
                            ...draft,
                            accountIds: toggleId(
                              [account.id],
                              draft.accountIds,
                            ),
                          })
                        }
                      >
                        <span>{account.name}</span>
                        {renderMark(checked)}
                      </button>
                    )
                  })}
              </div>
            )}
          </section>
        )}
      </section>
      {drawer === 'date' && customDateSide && customDate && (
        <DatePicker
          id={`date-picker-popup-${customDateSide}`}
          label={customDateLabel}
          value={customDate}
          onChange={(nextDate) =>
            onChange({ ...draft, [customDateKey]: nextDate })
          }
          onClose={() => setCustomDateSide(null)}
        />
      )}
    </div>
  )
}

export function FlowPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [filters, setFilters] = useState<Filters>(currentYearFilters)
  const [draft, setDraft] = useState<Filters>(currentYearFilters)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [items, setItems] = useState<LedgerTransaction[]>([])
  const [summaries, setSummaries] = useState<TransactionYearSummary[]>([])
  const [collapsedYears, setCollapsedYears] = useState<Set<string>>(
    () => new Set(),
  )
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(
    () => new Set(),
  )
  const [initialLoading, setInitialLoading] = useState(true)
  const [initialError, setInitialError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [accounts, setAccounts] = useState<LedgerAccount[]>([])
  const [categories, setCategories] = useState<LedgerCategory[]>([])
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [optionsRetryKey, setOptionsRetryKey] = useState(0)
  const requestRef = useRef<AbortController | null>(null)
  const generationRef = useRef(0)

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
          setCategories([...expense, ...income])
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
    setItems([])
    setSummaries([])
    setInitialLoading(true)
    setInitialError(null)
    fetchTransactions(
      buildQuery(filters, debouncedSearch),
      controller.signal,
    )
      .then((result) => {
        if (generation === generationRef.current) {
          setItems(result.list)
          setSummaries(result.summaries)
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

  const years = useMemo(() => groupTransactions(items), [items])
  const summaryByYear = useMemo(
    () => new Map(summaries.map((summary) => [summary.year, summary])),
    [summaries],
  )
  const toggleYear = (year: string) =>
    setCollapsedYears((current) => {
      const next = new Set(current)
      if (next.has(year)) next.delete(year)
      else next.add(year)
      return next
    })
  const toggleMonth = (month: string) =>
    setCollapsedMonths((current) => {
      const next = new Set(current)
      if (next.has(month)) next.delete(month)
      else next.add(month)
      return next
    })
  const changeMainType = (type: FlowType) =>
    setFilters((current) => {
      const apiType = flowTypes.find((item) => item.id === type)?.apiValue
      const validIds = new Set(
        categories
          .filter((category) => !apiType || category.categoryType === apiType)
          .flatMap(categoryIds),
      )
      return {
        ...current,
        type,
        categoryIds:
          apiType === 3
            ? []
            : current.categoryIds.filter((id) => validIds.has(id)),
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
    setFilters(currentYearFilters())
    setDraft(currentYearFilters())
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
              onClick={() => navigate('/tally', { state: { returnTo: '/flow' } })}
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
            years.map((year) => {
              const yearSummary = summaryByYear.get(year.year)
              const expanded = !collapsedYears.has(year.year)
              return (
                <section
                  className="flow-year"
                  key={year.year}
                  aria-labelledby={`flow-year-${year.year}`}
                >
                  <button
                    className="flow-year__header"
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={`flow-year-months-${year.year}`}
                    onClick={() => toggleYear(year.year)}
                  >
                    <span
                      className="flow-year__title"
                      id={`flow-year-${year.year}`}
                    >
                      {year.year}年
                    </span>
                    <span className="flow-year__summary">
                      结余{' '}
                      <strong>
                        {formatCents(yearSummary?.balance ?? '0')}
                      </strong>
                    </span>
                    {expanded ? (
                      <ChevronUp aria-hidden="true" size={19} />
                    ) : (
                      <ChevronDown aria-hidden="true" size={19} />
                    )}
                  </button>
                  {expanded && (
                    <div
                      className="flow-year__months"
                      id={`flow-year-months-${year.year}`}
                    >
                      {year.months.map((month) => {
                      const monthSummary = yearSummary?.months.find(
                        (summary) => summary.month === month.month,
                      )
                      const expanded = !collapsedMonths.has(month.month)
                      return (
                        <section
                          className="flow-month"
                          key={month.month}
                          aria-labelledby={`flow-month-${month.month}`}
                        >
                          <button
                            className="flow-month__header"
                            type="button"
                            aria-expanded={expanded}
                            aria-controls={`flow-month-rows-${month.month}`}
                            onClick={() => toggleMonth(month.month)}
                          >
                            <span className="flow-month__title">
                              <strong id={`flow-month-${month.month}`}>
                                {Number(month.month.slice(5))}月
                              </strong>
                              <small>{month.month.slice(0, 4)}</small>
                            </span>
                            <span className="flow-month__summary">
                              <strong>
                                {formatCents(monthSummary?.balance ?? '0')}
                              </strong>
                              <small>
                                <span>收入 {formatCents(monthSummary?.income ?? '0')}</span>
                                <i aria-hidden="true">|</i>
                                <span>支出 {formatCents(monthSummary?.expense ?? '0')}</span>
                              </small>
                            </span>
                            {expanded ? (
                              <ChevronUp aria-hidden="true" size={19} />
                            ) : (
                              <ChevronDown aria-hidden="true" size={19} />
                            )}
                          </button>
                          {expanded && (
                            <div
                              className="flow-month__rows"
                              id={`flow-month-rows-${month.month}`}
                            >
                              {month.list.map((transaction) => (
                                <TransactionRow
                                  transaction={transaction}
                                  key={transaction.id}
                                  onClick={() =>
                                    navigate(`/tally/${transaction.id}`, {
                                      state: { returnTo: '/flow' },
                                    })
                                  }
                                />
                              ))}
                            </div>
                          )}
                        </section>
                      )
                      })}
                    </div>
                  )}
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
          onReset={() => setDraft(currentYearFilters())}
          onApply={applyFilters}
          onRetryOptions={() => setOptionsRetryKey((key) => key + 1)}
        />
      )}
    </div>
  )
}
