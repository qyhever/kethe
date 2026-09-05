

import {
  ArrowLeft,
  Check,
  ChevronDown,
  Coffee,
  Search,
  ShoppingBag,
  Trash2,
  Utensils,
  X,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './SearchPage.css'

type FilterKey = 'period' | 'type' | 'account'

interface SearchTransaction {
  id: string
  title: string
  category: string
  subcategory: string
  account: string
  time: string
  amount: number
  icon: 'meal' | 'coffee' | 'shopping'
  keywords: string[]
}

interface SearchGroupData {
  id: string
  label: string
  date: string
  transactions: SearchTransaction[]
}

const filterOptions: Record<FilterKey, string[]> = {
  period: ['最近30天', '最近7天', '本月', '全部时间'],
  type: ['支出', '收入', '全部类型'],
  account: ['支付宝', '微信', '招商银行卡', '现金', '全部账户'],
}

const searchGroups: SearchGroupData[] = [
  {
    id: 'today',
    label: '今天',
    date: '09月05日',
    transactions: [
      { id: 'lunch', title: '午餐', category: '餐饮', subcategory: '早午晚餐', account: '支付宝', time: '12:36', amount: 32, icon: 'meal', keywords: ['午餐', '吃饭'] },
      { id: 'work-lunch', title: '工作日午餐', category: '餐饮', subcategory: '早午晚餐', account: '微信', time: '12:08', amount: 26, icon: 'meal', keywords: ['午餐', '工作日', '吃饭'] },
      { id: 'coffee', title: '午后咖啡', category: '餐饮', subcategory: '酒水饮料', account: '支付宝', time: '15:20', amount: 18, icon: 'coffee', keywords: ['午餐', '下午茶', '咖啡'] },
    ],
  },
  {
    id: 'yesterday',
    label: '昨天',
    date: '09月04日',
    transactions: [
      { id: 'previous-lunch', title: '午餐', category: '餐饮', subcategory: '早午晚餐', account: '招商银行卡', time: '12:41', amount: 30, icon: 'meal', keywords: ['午餐', '吃饭'] },
      { id: 'team-lunch', title: '和同事吃午饭', category: '餐饮', subcategory: '聚餐', account: '支付宝', time: '13:05', amount: 28, icon: 'meal', keywords: ['午餐', '午饭', '同事', '聚餐'] },
      { id: 'fruit', title: '午餐水果', category: '餐饮', subcategory: '水果零食', account: '现金', time: '18:10', amount: 12, icon: 'shopping', keywords: ['午餐', '水果', '零食'] },
    ],
  },
]

const transactionIcons = {
  meal: Utensils,
  coffee: Coffee,
  shopping: ShoppingBag,
}

function FilterChip({
  filterKey,
  label,
  activeFilter,
  onToggle,
  onSelect,
}: {
  filterKey: FilterKey
  label: string
  activeFilter: FilterKey | null
  onToggle: (key: FilterKey) => void
  onSelect: (key: FilterKey, value: string) => void
}) {
  const isOpen = activeFilter === filterKey

  return (
    <div className="search-filter">
      <button
        className={`search-filter__trigger${filterKey === 'period' ? ' is-primary' : ''}`}
        type="button"
        aria-expanded={isOpen}
        onClick={() => onToggle(filterKey)}
      >
        <span>{label}</span>
        <ChevronDown aria-hidden="true" size={17} strokeWidth={2.25} />
      </button>
      {isOpen && (
        <div className="search-filter__menu" role="listbox" aria-label={`${label}筛选`}>
          {filterOptions[filterKey].map((option) => (
            <button
              className={option === label ? 'is-selected' : undefined}
              key={option}
              type="button"
              role="option"
              aria-selected={option === label}
              onClick={() => onSelect(filterKey, option)}
            >
              <span>{option}</span>
              {option === label && <Check aria-hidden="true" size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function TransactionRow({ transaction }: { transaction: SearchTransaction }) {
  const Icon = transactionIcons[transaction.icon]

  return (
    <button className="search-transaction" type="button" aria-label={`${transaction.title}，支出 ${transaction.amount} 元`}>
      <span className={`search-transaction__icon search-transaction__icon--${transaction.icon}`}>
        <Icon aria-hidden="true" size={29} strokeWidth={2.35} />
      </span>
      <span className="search-transaction__content">
        <strong>{transaction.title}</strong>
        <small>
          {transaction.category}<i>·</i>{transaction.subcategory}<i>·</i>{transaction.account}<i>·</i>{transaction.time}
        </small>
      </span>
      <strong className="search-transaction__amount">-¥{transaction.amount.toFixed(2)}</strong>
    </button>
  )
}

function TransactionGroup({ group }: { group: SearchGroupData }) {
  const total = group.transactions.reduce((sum, transaction) => sum + transaction.amount, 0)

  return (
    <section className="search-result-card" aria-labelledby={`search-group-${group.id}`}>
      <header className="search-result-card__header">
        <div>
          <h2 id={`search-group-${group.id}`}>{group.label}</h2>
          <span>{group.date}</span>
        </div>
        <p>支出 <strong>¥{total.toFixed(2)}</strong></p>
      </header>
      <div className="search-result-card__rows">
        {group.transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} />)}
      </div>
    </section>
  )
}

function RecentSearches({
  items,
  onSearch,
  onClear,
}: {
  items: string[]
  onSearch: (value: string) => void
  onClear: () => void
}) {
  if (items.length === 0) return null

  return (
    <section className="recent-searches" aria-labelledby="recent-searches-title">
      <header>
        <h2 id="recent-searches-title">最近搜索</h2>
        <button type="button" onClick={onClear}>
          <Trash2 aria-hidden="true" size={20} strokeWidth={1.9} />
          <span>清空</span>
        </button>
      </header>
      <div className="recent-searches__items">
        {items.map((item) => <button key={item} type="button" onClick={() => onSearch(item)}>{item}</button>)}
      </div>
    </section>
  )
}

export function SearchPage() {
  const navigate = useNavigate()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('午餐')
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null)
  const [filters, setFilters] = useState<Record<FilterKey, string>>({ period: '最近30天', type: '支出', account: '支付宝' })
  const [isAccountFilterApplied, setIsAccountFilterApplied] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [recentSearches, setRecentSearches] = useState(['午餐', '支付宝', '38', '电影'])

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const account = filters.account

    return searchGroups
      .map((group) => ({
        ...group,
        transactions: group.transactions.filter((transaction) => {
          const searchableText = [transaction.title, transaction.category, transaction.subcategory, transaction.account, ...transaction.keywords].join(' ').toLowerCase()
          const matchesQuery = normalizedQuery === '' || searchableText.includes(normalizedQuery)
          const matchesAccount = !isAccountFilterApplied || account === '全部账户' || transaction.account === account
          return matchesQuery && matchesAccount
        }),
      }))
      .filter((group) => group.transactions.length > 0)
  }, [filters.account, isAccountFilterApplied, query])

  const visibleCount = filteredGroups.reduce((sum, group) => sum + group.transactions.length, 0)

  const runRecentSearch = (value: string) => {
    setQuery(value)
    setRecentSearches((items) => [value, ...items.filter((item) => item !== value)].slice(0, 6))
    searchInputRef.current?.focus()
  }

  const selectFilter = (key: FilterKey, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }))
    if (key === 'account') setIsAccountFilterApplied(true)
    setActiveFilter(null)
  }

  return (
    <div className="search-page" onClick={() => activeFilter && setActiveFilter(null)}>
      <main className="search-page__content" onClick={(event) => event.stopPropagation()}>
        <header className="search-page__header">
          <button className="search-page__back" type="button" aria-label="返回" onClick={() => navigate(-1)}>
            <ArrowLeft aria-hidden="true" size={29} strokeWidth={2.4} />
          </button>
          <h1>搜索</h1>
        </header>

        <div className="search-box-row">
          <label className="search-box">
            <Search aria-hidden="true" size={24} strokeWidth={2} />
            <input
              ref={searchInputRef}
              type="search"
              aria-label="搜索账单"
              value={query}
              placeholder="搜索账单"
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button type="button" aria-label="清空搜索内容" onClick={() => { setQuery(''); searchInputRef.current?.focus() }}>
                <X aria-hidden="true" size={15} strokeWidth={3} />
              </button>
            )}
          </label>
          <button className="search-box-row__cancel" type="button" onClick={() => navigate(-1)}>取消</button>
        </div>

        <div className="search-filter-row" aria-label="搜索筛选">
          {(['period', 'type', 'account'] as FilterKey[]).map((key) => (
            <FilterChip
              key={key}
              filterKey={key}
              label={filters[key]}
              activeFilter={activeFilter}
              onToggle={(selectedKey) => setActiveFilter((current) => current === selectedKey ? null : selectedKey)}
              onSelect={selectFilter}
            />
          ))}
          <button
            className={`search-filter__trigger${showAdvanced ? ' is-active' : ''}`}
            type="button"
            aria-expanded={showAdvanced}
            onClick={() => setShowAdvanced((visible) => !visible)}
          >
            <span>筛选</span>
            <ChevronDown aria-hidden="true" size={17} strokeWidth={2.25} />
          </button>
        </div>

        {showAdvanced && (
          <div className="search-advanced-filter">
            <span>金额不限</span><span>分类不限</span><span>备注不限</span>
            <button type="button" onClick={() => setShowAdvanced(false)}>完成</button>
          </div>
        )}

        <p className="search-result-summary">共 {visibleCount} 条结果，可按日期、类型和账户继续筛选</p>

        {filteredGroups.length > 0 ? (
          <div className="search-results">
            {filteredGroups.map((group) => <TransactionGroup key={group.id} group={group} />)}
          </div>
        ) : (
          <div className="search-empty">
            <Search aria-hidden="true" size={34} />
            <strong>没有找到相关账单</strong>
            <span>试试其他关键词或调整筛选条件</span>
          </div>
        )}

        <RecentSearches items={recentSearches} onSearch={runRecentSearch} onClear={() => setRecentSearches([])} />
      </main>
    </div>
  )
}
