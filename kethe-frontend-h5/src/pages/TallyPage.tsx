import { Loading } from '../components/Loading'
import {
  fetchExpenseProjects,
  type ExpenseProject,
} from '../api/expense-projects'
import { ExpenseProjectSheet } from '../components/ExpenseProject/ExpenseProjectSheet'
import { ExpenseProjectIcon } from '../components/ExpenseProject/ExpenseProjectIcon'
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Delete,
  LayoutList,
  NotebookPen,
  WalletCards,
  X,
} from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createTransaction,
  fetchAccounts,
  fetchCategories,
  fetchTransaction,
  updateTransaction,
} from '../api/ledger'
import type {
  CreateTransactionPayload,
  LedgerAccount,
  LedgerCategory,
  LedgerTransaction,
} from '../api/types'
import { fetchMembers, type LedgerMember } from '../api/members'
import { MemberSheet } from '../components/Member/MemberSheet'
import { MemberIcon } from '../components/Member/MemberIcon'
import { AccountSheet } from '../components/AccountSheet'
import { CategoryIcon } from '../components/CategoryIcon/CategoryIcon'
import { useToast } from '../components/Toast'
import { TransactionTimePicker } from '../components/TransactionTimePicker/TransactionTimePicker'
import './TallyPage.css'

type TallyType = 'expense' | 'income' | 'transfer'
type AccountPicker = 'account' | 'target'
type AccountOption = Pick<LedgerAccount, 'id' | 'name'>

interface Category {
  id: string
  label: string
  parentId: string | null
  iconKey: string | null
  svgContent: string | null
  iconColor: string | null
  children: Category[]
}

const tallyTypes: Array<{ id: TallyType; label: string }> = [
  { id: 'expense', label: '支出' },
  { id: 'income', label: '收入' },
  { id: 'transfer', label: '转账' },
]

function padTimePart(value: number) {
  return String(value).padStart(2, '0')
}

function getCurrentDateTime() {
  return toLocalDateTime(new Date().toISOString())
}

function toLocalDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date(date.getTime() + 8 * 60 * 60 * 1000)
  return [
    `${now.getUTCFullYear()}-${padTimePart(now.getUTCMonth() + 1)}-${padTimePart(now.getUTCDate())}`,
    `${padTimePart(now.getUTCHours())}:${padTimePart(now.getUTCMinutes())}`,
  ].join('T')
}

function centsToAmount(value: string) {
  if (!/^\d+$/.test(value)) return ''
  const cents = BigInt(value)
  return `${cents / 100n}.${(cents % 100n).toString().padStart(2, '0')}`
}

function normalizeCategories(items: LedgerCategory[]): Category[] {
  return items
    .filter((parent) => parent.isEnabled)
    .map((parent) => {
      const children = (parent.children ?? [])
        .filter((child) => child.isEnabled)
        .map((child) => ({
          id: child.id,
          label: child.name,
          parentId: child.parentId ?? parent.id,
          iconKey: child.iconKey,
          svgContent: child.svgContent,
          iconColor: child.iconColor,
          children: [],
        }))

      return {
        id: parent.id,
        label: parent.name,
        parentId: parent.parentId,
        iconKey: parent.iconKey,
        svgContent: parent.svgContent,
        iconColor: parent.iconColor,
        children,
      }
    })
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function findCategory(items: Category[], id: string | null) {
  if (!id) return undefined
  for (const item of items) {
    if (item.id === id) return item
    const child = item.children.find((candidate) => candidate.id === id)
    if (child) return child
  }
  return undefined
}

function amountToCents(value: string) {
  const normalized = value.trim()
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return null

  const [yuan = '0', fraction = ''] = normalized.split('.')
  const cents = BigInt(yuan) * 100n + BigInt(`${fraction}00`.slice(0, 2))
  return cents > 0n ? cents.toString() : null
}

function TypeSegment({
  value,
  compact = false,
  disabled = false,
  onChange,
}: {
  value: TallyType
  compact?: boolean
  disabled?: boolean
  onChange: (value: TallyType) => void
}) {
  const items = compact ? tallyTypes.slice(0, 2) : tallyTypes

  return (
    <div
      className={`tally-segment${compact ? ' tally-segment--compact' : ''}`}
      role="tablist"
      aria-label="记账类型"
    >
      {items.map((item) => (
        <button
          className={value === item.id ? 'is-active' : undefined}
          key={item.id}
          type="button"
          disabled={disabled}
          role="tab"
          aria-selected={value === item.id}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function TallyHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="tally-header">
      <button type="button" aria-label="返回" onClick={onBack}>
        <ArrowLeft aria-hidden="true" size={25} strokeWidth={2.1} />
      </button>
      <h1>{title}</h1>
      <span aria-hidden="true" />
    </header>
  )
}

function AmountEditor({
  amount,
  disabled = false,
  onClear,
}: {
  amount: string
  disabled?: boolean
  onClear: () => void
}) {
  return (
    <div
      className="tally-amount"
      aria-live="polite"
      aria-label={`金额 ${amount || '0.00'} 元`}
    >
      <span className="tally-amount__currency">¥</span>
      <span className="tally-amount__caret" aria-hidden="true" />
      <strong className={amount ? 'has-value' : undefined}>
        {amount || '0.00'}
      </strong>
      {amount && (
        <button
          disabled={disabled}
          type="button"
          aria-label="清空金额"
          onClick={onClear}
        >
          <X aria-hidden="true" size={14} strokeWidth={3} />
        </button>
      )}
    </div>
  )
}

function FormRow({
  icon,
  label,
  value,
  muted = false,
  disabled = false,
  onClick,
}: {
  icon: ReactNode
  label: string
  value: string
  muted?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      className="tally-form-row"
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      <span className="tally-form-row__icon">{icon}</span>
      <span className="tally-form-row__label">{label}</span>
      <span
        className={
          muted ? 'tally-form-row__value is-muted' : 'tally-form-row__value'
        }
      >
        {value}
      </span>
      <ChevronRight aria-hidden="true" size={20} strokeWidth={1.8} />
    </button>
  )
}

function NumericKeyboard({
  disabled = false,
  onInput,
  onDelete,
}: {
  disabled?: boolean
  onInput: (key: string) => void
  onDelete: () => void
}) {
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  return (
    <div className="tally-keyboard" aria-label="数字键盘">
      <div className="tally-keyboard__numbers">
        {numbers.map((number) => (
          <button
            disabled={disabled}
            key={number}
            type="button"
            onClick={() => onInput(number)}
          >
            {number}
          </button>
        ))}
      </div>
      <div className="tally-keyboard__actions">
        <button
          className="tally-keyboard__delete"
          disabled={disabled}
          type="button"
          aria-label="退格"
          onClick={onDelete}
        >
          <Delete aria-hidden="true" size={25} strokeWidth={1.8} />
        </button>
        <button
          disabled={disabled}
          type="button"
          aria-label="小数点"
          onClick={() => onInput('.')}
        >
          .
        </button>
        <button disabled={disabled} type="button" onClick={() => onInput('0')}>
          0
        </button>
      </div>
    </div>
  )
}

function CategoryVisual({ category }: { category: Category }) {
  return (
    <CategoryIcon
      name={category.iconKey ?? ''}
      svgContent={category.svgContent}
      size={26}
      color="currentColor"
    />
  )
}

function CategoryPage({
  type,
  categories,
  loading,
  error,
  disabled,
  selected,
  onTypeChange,
  onSelect,
  onBack,
}: {
  type: TallyType
  categories: Category[]
  loading: boolean
  error?: string
  disabled?: boolean
  selected?: Category
  onTypeChange: (value: TallyType) => void
  onSelect: (category: Category) => void
  onBack: () => void
}) {
  const visibleType = type === 'income' ? 'income' : 'expense'
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setExpandedIds(new Set())
  }, [visibleType])

  const handleParentClick = (category: Category) => {
    if (category.children.length === 0) {
      onSelect(category)
      return
    }

    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(category.id)) next.delete(category.id)
      else next.add(category.id)
      return next
    })
  }

  return (
    <main className="tally-page tally-category-page">
      <div className="tally-page__content">
        <TallyHeader title="选择分类" onBack={onBack} />
        <TypeSegment
          compact
          disabled={disabled}
          value={visibleType}
          onChange={onTypeChange}
        />
        {error && (
          <p className="tally-status tally-status--error" role="alert">
            {error}
          </p>
        )}
        {loading && <Loading variant="compact" text="正在加载分类…" />}
        {!loading && !error && categories.length === 0 && (
          <p className="tally-status">暂无可用分类</p>
        )}
        {!loading && categories.length > 0 && (
          <section
            className="tally-category-list"
            aria-label={`${visibleType === 'income' ? '收入' : '支出'}分类`}
          >
            {categories.map((category) => {
              const isExpanded = expandedIds.has(category.id)
              const hasChildren = category.children.length > 0
              const colorStyle = {
                '--icon-color': category.iconColor ?? '#64748B',
              } as CSSProperties

              return (
                <div
                  className={`tally-category-group${isExpanded ? ' is-expanded' : ''}`}
                  key={category.id}
                >
                  <button
                    className={`tally-category-list__parent${selected?.id === category.id ? ' is-selected' : ''}`}
                    type="button"
                    disabled={disabled}
                    aria-expanded={hasChildren ? isExpanded : undefined}
                    onClick={() => handleParentClick(category)}
                  >
                    <span className="category-icon-badge" style={colorStyle}>
                      <CategoryVisual category={category} />
                    </span>
                    <span>{category.label}</span>
                    <ChevronRight
                      className="tally-category-list__chevron"
                      aria-hidden="true"
                      size={20}
                      strokeWidth={1.8}
                    />
                  </button>
                  {hasChildren && (
                    <div
                      className="tally-category-list__children"
                      hidden={!isExpanded}
                    >
                      {category.children.map((child) => (
                        <button
                          className={
                            selected?.id === child.id
                              ? 'is-selected'
                              : undefined
                          }
                          key={child.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => onSelect(child)}
                        >
                          <span
                            className="category-icon-badge category-icon-badge--child"
                            style={
                              {
                                '--icon-color': child.iconColor ?? '#64748B',
                              } as CSSProperties
                            }
                          >
                            <CategoryVisual category={child} />
                          </span>
                          <span>{child.label}</span>
                          <ChevronRight
                            aria-hidden="true"
                            size={18}
                            strokeWidth={1.8}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </section>
        )}
      </div>
    </main>
  )
}

export function TallyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const savingRef = useRef(false)
  const normalizedPath = location.pathname.replace(/\/$/, '')
  const isCategoryPage =
    normalizedPath === '/tally/category' ||
    /^\/tally\/[^/]+\/category$/.test(normalizedPath)
  const transactionMatch =
    normalizedPath === '/tally/category'
      ? null
      : normalizedPath.match(/^\/tally\/([^/]+)(?:\/category)?$/)
  const transactionId = transactionMatch?.[1]
  const isEditing = transactionId !== undefined
  const isValidTransactionId =
    !!transactionId && /^[1-9]\d*$/.test(transactionId)
  const tallyPath = isEditing ? `/tally/${transactionId}` : '/tally'
  const routeState = location.state as {
    returnTo?: unknown
    returnSearch?: string
  } | null
  const returnTo =
    routeState?.returnTo === '/flow' ||
    routeState?.returnTo === '/home' ||
    routeState?.returnTo === '/bill'
      ? routeState.returnTo
      : isEditing
        ? '/flow'
        : '/home'
  const returnPath =
    returnTo === '/flow'
      ? returnTo + (routeState?.returnSearch ?? '')
      : returnTo
  const [projects, setProjects] = useState<ExpenseProject[]>([])
  const [expenseProjectId, setExpenseProjectId] = useState<string | null>(null)
  const [projectOpen, setProjectOpen] = useState(false)
  const [projectError, setProjectError] = useState<string>()
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsRetry, setProjectsRetry] = useState(0)
  useEffect(() => {
    let active = true
    setProjectsLoading(true)
    setProjectError(undefined)
    fetchExpenseProjects()
      .then((items) => {
        if (active) setProjects(items)
      })
      .catch((reason: unknown) => {
        if (active) setProjectError(getErrorMessage(reason, '项目加载失败'))
      })
      .finally(() => {
        if (active) setProjectsLoading(false)
      })
    return () => {
      active = false
    }
  }, [projectsRetry])
  const [members, setMembers] = useState<LedgerMember[]>([])
  const [memberId, setMemberId] = useState<string | null>(null)
  const [memberError, setMemberError] = useState<string>()
  const [membersLoading, setMembersLoading] = useState(true)
  const [membersRetry, setMembersRetry] = useState(0)
  const [memberOpen, setMemberOpen] = useState(false)
  useEffect(() => {
    let active = true
    setMembersLoading(true)
    setMemberError(undefined)
    fetchMembers()
      .then((items) => {
        if (active) setMembers(items)
      })
      .catch((reason: unknown) => {
        if (active) setMemberError(getErrorMessage(reason, '成员加载失败'))
      })
      .finally(() => {
        if (active) setMembersLoading(false)
      })
    return () => {
      active = false
    }
  }, [membersRetry])
  const [type, setType] = useState<TallyType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>()
  const [account, setAccount] = useState<AccountOption>()
  const [targetAccount, setTargetAccount] = useState<AccountOption>()
  const [dateTime, setDateTime] = useState(getCurrentDateTime)
  const [timePrecision, setTimePrecision] = useState<1 | 2>(2)
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false)
  const [note, setNote] = useState('')
  const [accounts, setAccounts] = useState<LedgerAccount[]>([])
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([])
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([])
  const [isLoadingResources, setIsLoadingResources] = useState(true)
  const [accountError, setAccountError] = useState<string>()
  const [expenseCategoryError, setExpenseCategoryError] = useState<string>()
  const [incomeCategoryError, setIncomeCategoryError] = useState<string>()
  const [accountPicker, setAccountPicker] = useState<AccountPicker>()
  const [isSaving, setIsSaving] = useState(false)
  const [transaction, setTransaction] = useState<LedgerTransaction>()
  const [isLoadingDetail, setIsLoadingDetail] = useState(isEditing)
  const [detailError, setDetailError] = useState<string>()
  const [detailRetryKey, setDetailRetryKey] = useState(0)
  const [isDetailHydrated, setIsDetailHydrated] = useState(!isEditing)

  useEffect(() => {
    let active = true

    async function loadResources() {
      const [accountsResult, expenseResult, incomeResult] =
        await Promise.allSettled([
          fetchAccounts(),
          fetchCategories(1),
          fetchCategories(2),
        ])

      if (!active) return

      const errors: string[] = []
      if (accountsResult.status === 'fulfilled') {
        setAccounts(accountsResult.value.filter((item) => item.isEnabled))
      } else {
        const message = `账户加载失败：${getErrorMessage(accountsResult.reason, '请稍后重试')}`
        setAccountError(message)
        errors.push(message)
      }
      if (expenseResult.status === 'fulfilled') {
        setExpenseCategories(normalizeCategories(expenseResult.value))
      } else {
        const message = `支出分类加载失败：${getErrorMessage(expenseResult.reason, '请稍后重试')}`
        setExpenseCategoryError(message)
        errors.push(message)
      }
      if (incomeResult.status === 'fulfilled') {
        setIncomeCategories(normalizeCategories(incomeResult.value))
      } else {
        const message = `收入分类加载失败：${getErrorMessage(incomeResult.reason, '请稍后重试')}`
        setIncomeCategoryError(message)
        errors.push(message)
      }

      setIsLoadingResources(false)
      if (errors.length > 0) toast.error(errors.join('；'), { duration: 5000 })
    }

    void loadResources()
    return () => {
      active = false
    }
  }, [toast])

  useEffect(() => {
    if (!isEditing) return

    setTransaction(undefined)
    setIsDetailHydrated(false)
    if (!isValidTransactionId || !transactionId) {
      setDetailError('无效的流水 ID')
      setIsLoadingDetail(false)
      return
    }

    let active = true
    setDetailError(undefined)
    setIsLoadingDetail(true)
    fetchTransaction(transactionId)
      .then((result) => {
        if (active) setTransaction(result)
      })
      .catch((error: unknown) => {
        if (active)
          setDetailError(
            `流水详情加载失败：${getErrorMessage(error, '请稍后重试')}`,
          )
      })
      .finally(() => {
        if (active) setIsLoadingDetail(false)
      })

    return () => {
      active = false
    }
  }, [detailRetryKey, isEditing, isValidTransactionId, transactionId])

  useEffect(() => {
    if (!transaction || isLoadingResources) return

    const nextType: TallyType =
      transaction.transactionType === 1
        ? 'expense'
        : transaction.transactionType === 2
          ? 'income'
          : 'transfer'
    const categoryItems =
      nextType === 'income' ? incomeCategories : expenseCategories
    const matchedCategory = findCategory(categoryItems, transaction.categoryId)
    const fallbackCategory = transaction.categoryId
      ? {
          id: transaction.categoryId,
          label: transaction.categoryName ?? '未分类',
          parentId: transaction.parentCategoryId,
          iconKey: transaction.iconKey,
          svgContent: transaction.svgContent,
          iconColor: transaction.iconColor,
          children: [],
        }
      : undefined

    setType(nextType)
    setExpenseProjectId(transaction.expenseProjectId)
    setMemberId(transaction.memberId)
    setAmount(centsToAmount(transaction.amount))
    setCategory(matchedCategory ?? fallbackCategory)
    setAccount(
      accounts.find((item) => item.id === transaction.accountId) ?? {
        id: transaction.accountId,
        name: transaction.accountName || '未知账户',
      },
    )
    setTargetAccount(
      transaction.targetAccountId
        ? (accounts.find((item) => item.id === transaction.targetAccountId) ?? {
            id: transaction.targetAccountId,
            name: transaction.targetAccountName || '未知账户',
          })
        : undefined,
    )
    setDateTime(toLocalDateTime(transaction.transactionTime))
    setTimePrecision(transaction.timePrecision)
    setNote(transaction.remark ?? '')
    setIsDetailHydrated(true)
  }, [
    accounts,
    expenseCategories,
    incomeCategories,
    isLoadingResources,
    transaction,
  ])

  const handleTypeChange = (nextType: TallyType) => {
    if (nextType !== 'expense') setExpenseProjectId(null)
    if (nextType === 'transfer') setMemberId(null)
    setType(nextType)
    setCategory(undefined)
    setTargetAccount(undefined)
  }

  const handleAmountInput = (key: string) => {
    setAmount((current) => {
      if (key === '.') {
        if (current.includes('.')) return current
        return current ? `${current}.` : '0.'
      }
      const decimal = current.split('.')[1]
      if (decimal?.length === 2 || current.replace('.', '').length >= 9)
        return current
      if (current === '0') return key
      return `${current}${key}`
    })
  }

  const handleSave = async () => {
    if (savingRef.current || (isEditing && !isDetailHydrated)) return

    const cents = amountToCents(amount)
    if (!cents) {
      toast.info('请输入记账金额')
      return
    }
    if (!account) {
      toast.info(type === 'transfer' ? '请选择转出账户' : '请选择账户')
      return
    }
    if (type === 'transfer') {
      if (!targetAccount) {
        toast.info('请选择转入账户')
        return
      }
      if (account.id === targetAccount.id) {
        toast.info('转出和转入账户不能相同')
        return
      }
    } else if (!category) {
      toast.info('请选择分类')
      return
    }

    const transactionDate = new Date(
      timePrecision === 1
        ? `${dateTime.slice(0, 10)}T12:00:00+08:00`
        : `${dateTime}:00+08:00`,
    )
    if (Number.isNaN(transactionDate.getTime())) {
      toast.info('请选择有效的交易时间')
      return
    }

    savingRef.current = true
    setIsSaving(true)
    try {
      const relatedResource =
        type === 'transfer'
          ? { targetAccountId: targetAccount!.id }
          : { categoryId: category!.id }
      const payload: CreateTransactionPayload = {
        expenseProjectId: type === 'expense' ? expenseProjectId : null,
        memberId: type === 'transfer' ? null : memberId,
        transactionType: type === 'expense' ? 1 : type === 'income' ? 2 : 3,
        amount: cents,
        ...relatedResource,
        accountId: account.id,
        currency: 'CNY',
        transactionTime: transactionDate.toISOString(),
        timePrecision,
        remark: note.trim() || undefined,
      }
      if (isEditing) await updateTransaction(transactionId!, payload)
      else await createTransaction(payload)
      toast.success(isEditing ? '修改成功' : '记账成功')
      navigate(returnPath, {
        state:
          returnTo === '/flow'
            ? { refreshFlow: true, restoreFlow: true }
            : undefined,
      })
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          isEditing ? '修改失败，请稍后重试' : '记账失败，请稍后重试',
        ),
        { duration: 5000 },
      )
    } finally {
      savingRef.current = false
      setIsSaving(false)
    }
  }

  if (isCategoryPage && (!isEditing || isDetailHydrated)) {
    const visibleType = type === 'income' ? 'income' : 'expense'
    const categories =
      visibleType === 'income' ? incomeCategories : expenseCategories
    const categoryError =
      visibleType === 'income' ? incomeCategoryError : expenseCategoryError

    return (
      <CategoryPage
        type={type}
        categories={categories}
        loading={isLoadingResources}
        error={categoryError}
        disabled={isEditing && !isDetailHydrated}
        selected={category}
        onTypeChange={handleTypeChange}
        onBack={() => navigate(tallyPath, { state: location.state })}
        onSelect={(nextCategory) => {
          setCategory(nextCategory)
          navigate(tallyPath, { state: location.state })
        }}
      />
    )
  }

  const formattedDate = dateTime
    ? timePrecision === 1
      ? dateTime
          .slice(0, 10)
          .replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1年$2月$3日')
      : dateTime.replace(
          /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
          '$1年$2月$3日  $4:$5',
        )
    : '请选择'
  const accountValue =
    account?.name ??
    (isLoadingResources ? '加载中…' : accountError ? '加载失败' : '请选择')
  const isInteractionDisabled = isSaving || (isEditing && !isDetailHydrated)

  return (
    <main className="tally-page tally-entry-page">
      <div className="tally-page__content">
        <TallyHeader
          title={isEditing ? '编辑流水' : '记一笔'}
          onBack={() =>
            navigate(returnPath, {
              state: returnTo === '/flow' ? { restoreFlow: true } : undefined,
            })
          }
        />
        <TypeSegment
          disabled={isInteractionDisabled}
          value={type}
          onChange={handleTypeChange}
        />
        <AmountEditor
          amount={amount}
          disabled={isInteractionDisabled}
          onClear={() => setAmount('')}
        />

        {isLoadingDetail && (
          <Loading variant="compact" text="正在加载流水详情…" />
        )}
        {detailError && (
          <div className="tally-detail-error" role="alert">
            <p>{detailError}</p>
            {isValidTransactionId && (
              <button
                type="button"
                onClick={() => setDetailRetryKey((key) => key + 1)}
              >
                重试
              </button>
            )}
          </div>
        )}

        <section className="tally-form" aria-label="记账信息">
          {type !== 'transfer' && (
            <FormRow
              icon={<LayoutList size={23} strokeWidth={1.8} />}
              label="分类"
              value={
                category?.label ?? (isLoadingResources ? '加载中…' : '请选择')
              }
              muted={!category}
              disabled={isInteractionDisabled}
              onClick={() =>
                navigate(`${tallyPath}/category`, { state: location.state })
              }
            />
          )}
          <FormRow
            icon={<WalletCards size={23} strokeWidth={1.8} />}
            label={type === 'transfer' ? '转出账户' : '账户'}
            value={accountValue}
            muted={!account}
            disabled={isInteractionDisabled}
            onClick={() => setAccountPicker('account')}
          />
          {type !== 'transfer' && (
            <FormRow
              icon={
                <MemberIcon
                  iconKey={
                    members.find((item) => item.id === memberId)?.iconKey ??
                    transaction?.memberIconKey
                  }
                />
              }
              label="成员"
              value={
                memberId === null
                  ? '无'
                  : (members.find((item) => item.id === memberId)?.name ??
                    (transaction?.memberId === memberId
                      ? (transaction.memberName ?? '未知成员') +
                        (transaction.memberDeleted ? '（已删除）' : '')
                      : '未知成员'))
              }
              disabled={isInteractionDisabled}
              onClick={() => setMemberOpen(true)}
            />
          )}
          {type === 'expense' && (
            <FormRow
              icon={
                <ExpenseProjectIcon
                  iconKey={
                    projects.find((item) => item.id === expenseProjectId)
                      ?.iconKey ?? transaction?.expenseProjectIconKey
                  }
                />
              }
              label="项目"
              value={
                expenseProjectId === null
                  ? '无'
                  : (projects.find((item) => item.id === expenseProjectId)
                      ?.name ??
                    (transaction?.expenseProjectName ?? '未知项目') +
                      (transaction?.expenseProjectArchived ? '（已归档）' : ''))
              }
              disabled={isInteractionDisabled}
              onClick={() => setProjectOpen(true)}
            />
          )}
          {type === 'transfer' && (
            <FormRow
              icon={<WalletCards size={23} strokeWidth={1.8} />}
              label="转入账户"
              value={
                targetAccount?.name ??
                (isLoadingResources ? '加载中…' : '请选择')
              }
              muted={!targetAccount}
              disabled={isInteractionDisabled}
              onClick={() => setAccountPicker('target')}
            />
          )}
          <FormRow
            icon={<CalendarDays size={23} strokeWidth={1.8} />}
            label="时间"
            value={formattedDate}
            disabled={isInteractionDisabled}
            onClick={() => setIsTimePickerOpen(true)}
          />
          <label className="tally-form-row tally-note-row">
            <span className="tally-form-row__icon">
              <NotebookPen size={23} strokeWidth={1.8} />
            </span>
            <span className="tally-form-row__label">备注</span>
            <input
              aria-label="备注"
              disabled={isInteractionDisabled}
              placeholder="添加备注（选填）"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
        </section>
      </div>

      <footer className="tally-entry-footer">
        <NumericKeyboard
          disabled={isInteractionDisabled}
          onInput={handleAmountInput}
          onDelete={() => setAmount((current) => current.slice(0, -1))}
        />
        <button
          className="tally-save"
          disabled={isInteractionDisabled}
          type="button"
          onClick={() => void handleSave()}
        >
          {isSaving ? '保存中…' : '保存'}
        </button>
      </footer>

      <ExpenseProjectSheet
        open={projectOpen}
        loading={projectsLoading}
        error={projectError}
        onRetry={() => setProjectsRetry((value) => value + 1)}
        accounts={[
          { name: '无' },
          ...projects,
          ...(expenseProjectId &&
          transaction?.expenseProjectId === expenseProjectId &&
          transaction.expenseProjectArchived &&
          !projects.some((item) => item.id === expenseProjectId)
            ? [
                {
                  id: expenseProjectId,
                  name: transaction.expenseProjectName + '（已归档）',
                  iconKey: transaction.expenseProjectIconKey,
                },
              ]
            : []),
        ]}
        selectedId={expenseProjectId ?? undefined}
        onClose={() => setProjectOpen(false)}
        onSelect={(item) => {
          setExpenseProjectId(item.id ?? null)
          setProjectOpen(false)
        }}
      />
      <MemberSheet
        open={memberOpen}
        loading={membersLoading}
        error={memberError}
        onRetry={() => setMembersRetry((value) => value + 1)}
        accounts={[
          { name: '无' },
          ...members,
          ...(memberId &&
          transaction?.memberId === memberId &&
          transaction.memberDeleted &&
          !members.some((item) => item.id === memberId)
            ? [
                {
                  id: memberId,
                  name: transaction.memberName + '（已删除）',
                  iconKey: transaction.memberIconKey,
                },
              ]
            : []),
        ]}
        selectedId={memberId ?? undefined}
        onClose={() => setMemberOpen(false)}
        onSelect={(item) => {
          setMemberId(item.id ?? null)
          setMemberOpen(false)
        }}
      />
      <AccountSheet
        open={Boolean(accountPicker)}
        accounts={accounts.map((item) => {
          const excludeId =
            type === 'transfer'
              ? accountPicker === 'account'
                ? targetAccount?.id
                : account?.id
              : undefined
          const disabled = item.id === excludeId
          return { ...item, disabled, hint: disabled ? '当前账户' : undefined }
        })}
        loading={isLoadingResources}
        selectedId={
          accountPicker === 'account' ? account?.id : targetAccount?.id
        }
        onClose={() => setAccountPicker(undefined)}
        onSelect={(nextAccount) => {
          if (!nextAccount.id) return
          if (accountPicker === 'target')
            setTargetAccount(nextAccount as AccountOption)
          else setAccount(nextAccount as AccountOption)
          setAccountPicker(undefined)
        }}
      />
      <TransactionTimePicker
        open={isTimePickerOpen}
        value={dateTime}
        precision={timePrecision}
        onClose={() => setIsTimePickerOpen(false)}
        onConfirm={(value, precision) => {
          setDateTime(value)
          setTimePrecision(precision)
          setIsTimePickerOpen(false)
        }}
      />
    </main>
  )
}
