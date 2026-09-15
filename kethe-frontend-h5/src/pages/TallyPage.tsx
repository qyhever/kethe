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
import { CategoryIcon } from '../components/CategoryIcon/CategoryIcon'
import { useToast } from '../components/Toast'
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
  const now = new Date()
  return [
    `${now.getFullYear()}-${padTimePart(now.getMonth() + 1)}-${padTimePart(now.getDate())}`,
    `${padTimePart(now.getHours())}:${padTimePart(now.getMinutes())}`,
  ].join('T')
}

function toLocalDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return [
    `${date.getFullYear()}-${padTimePart(date.getMonth() + 1)}-${padTimePart(date.getDate())}`,
    `${padTimePart(date.getHours())}:${padTimePart(date.getMinutes())}`,
  ].join('T')
}

function centsToAmount(value: string) {
  if (!/^\d+$/.test(value)) return ''
  const cents = BigInt(value)
  return `${cents / 100n}.${(cents % 100n).toString().padStart(2, '0')}`
}

function normalizeCategories(items: LedgerCategory[]): Category[] {
  return items.filter((parent) => parent.isEnabled).map((parent) => {
    const children = (parent.children ?? [])
      .filter((child) => child.isEnabled)
      .map((child) => ({
        id: child.id,
        label: child.name,
        parentId: child.parentId ?? parent.id,
        iconKey: child.iconKey ?? parent.iconKey,
        svgContent: child.svgContent ?? parent.svgContent,
        iconColor: child.iconColor ?? parent.iconColor,
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
    <div className={`tally-segment${compact ? ' tally-segment--compact' : ''}`} role="tablist" aria-label="记账类型">
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
    <div className="tally-amount" aria-live="polite" aria-label={`金额 ${amount || '0.00'} 元`}>
      <span className="tally-amount__currency">¥</span>
      <span className="tally-amount__caret" aria-hidden="true" />
      <strong className={amount ? 'has-value' : undefined}>{amount || '0.00'}</strong>
      {amount && (
        <button disabled={disabled} type="button" aria-label="清空金额" onClick={onClear}>
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
    <button className="tally-form-row" type="button" disabled={disabled} onClick={onClick}>
      <span className="tally-form-row__icon">{icon}</span>
      <span className="tally-form-row__label">{label}</span>
      <span className={muted ? 'tally-form-row__value is-muted' : 'tally-form-row__value'}>{value}</span>
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
          <button disabled={disabled} key={number} type="button" onClick={() => onInput(number)}>{number}</button>
        ))}
      </div>
      <div className="tally-keyboard__actions">
        <button className="tally-keyboard__delete" disabled={disabled} type="button" aria-label="退格" onClick={onDelete}>
          <Delete aria-hidden="true" size={25} strokeWidth={1.8} />
        </button>
        <button disabled={disabled} type="button" aria-label="小数点" onClick={() => onInput('.')}>.</button>
        <button disabled={disabled} type="button" onClick={() => onInput('0')}>0</button>
      </div>
    </div>
  )
}

function AccountSheet({
  accounts,
  loading,
  selected,
  excludeId,
  title,
  onSelect,
  onClose,
}: {
  accounts: LedgerAccount[]
  loading: boolean
  selected?: AccountOption
  excludeId?: string
  title: string
  onSelect: (account: LedgerAccount) => void
  onClose: () => void
}) {
  return (
    <div className="account-sheet" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section role="dialog" aria-modal="true" aria-labelledby="account-title">
        <header><h2 id="account-title">{title}</h2><button type="button" onClick={onClose}>取消</button></header>
        {loading && <p className="tally-status">正在加载账户…</p>}
        {!loading && accounts.length === 0 && <p className="tally-status">暂无可用账户</p>}
        {!loading && accounts.map((account) => {
          const unavailable = account.id === excludeId
          return (
            <button
              className={selected?.id === account.id ? 'is-selected' : undefined}
              disabled={unavailable}
              key={account.id}
              type="button"
              onClick={() => onSelect(account)}
            >
              <WalletCards aria-hidden="true" size={22} />
              <span>{account.name}</span>
              {unavailable ? <span className="account-sheet__hint">当前账户</span> : selected?.id === account.id && <span aria-hidden="true">✓</span>}
            </button>
          )
        })}
      </section>
    </div>
  )
}

function CategoryVisual({ category }: { category: Category }) {
  if (category.svgContent) {
    return (
      <span
        className="tally-category-list__svg-icon"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: category.svgContent }}
      />
    )
  }

  return <CategoryIcon name={category.iconKey ?? 'other'} size={27} color="currentColor" />
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
        <TypeSegment compact disabled={disabled} value={visibleType} onChange={onTypeChange} />
        {error && <p className="tally-status tally-status--error" role="alert">{error}</p>}
        {loading && <p className="tally-status">正在加载分类…</p>}
        {!loading && !error && categories.length === 0 && <p className="tally-status">暂无可用分类</p>}
        {!loading && categories.length > 0 && (
          <section className="tally-category-list" aria-label={`${visibleType === 'income' ? '收入' : '支出'}分类`}>
            {categories.map((category) => {
              const isExpanded = expandedIds.has(category.id)
              const hasChildren = category.children.length > 0
              const colorStyle = {
                '--category-color': category.iconColor ?? '#64748B',
              } as CSSProperties

              return (
                <div className={`tally-category-group${isExpanded ? ' is-expanded' : ''}`} key={category.id}>
                  <button
                    className={`tally-category-list__parent${selected?.id === category.id ? ' is-selected' : ''}`}
                    type="button"
                    disabled={disabled}
                    aria-expanded={hasChildren ? isExpanded : undefined}
                    onClick={() => handleParentClick(category)}
                  >
                    <span className="tally-category-list__icon" style={colorStyle}>
                      <CategoryVisual category={category} />
                    </span>
                    <span>{category.label}</span>
                    <ChevronRight className="tally-category-list__chevron" aria-hidden="true" size={20} strokeWidth={1.8} />
                  </button>
                  {hasChildren && (
                    <div className="tally-category-list__children" hidden={!isExpanded}>
                      {category.children.map((child) => (
                        <button
                          className={selected?.id === child.id ? 'is-selected' : undefined}
                          key={child.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => onSelect(child)}
                        >
                          <span className="tally-category-list__child-mark" style={colorStyle} aria-hidden="true" />
                          <span>{child.label}</span>
                          <ChevronRight aria-hidden="true" size={18} strokeWidth={1.8} />
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
  const dateInputRef = useRef<HTMLInputElement>(null)
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
  const isValidTransactionId = !!transactionId && /^[1-9]\d*$/.test(transactionId)
  const tallyPath = isEditing ? `/tally/${transactionId}` : '/tally'
  const routeState = location.state as { returnTo?: unknown } | null
  const returnTo =
    routeState?.returnTo === '/flow' || routeState?.returnTo === '/home'
      ? routeState.returnTo
      : isEditing
        ? '/flow'
        : '/home'
  const [type, setType] = useState<TallyType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>()
  const [account, setAccount] = useState<AccountOption>()
  const [targetAccount, setTargetAccount] = useState<AccountOption>()
  const [dateTime, setDateTime] = useState(getCurrentDateTime)
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
      const [accountsResult, expenseResult, incomeResult] = await Promise.allSettled([
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
        ? accounts.find((item) => item.id === transaction.targetAccountId) ?? {
            id: transaction.targetAccountId,
            name: transaction.targetAccountName || '未知账户',
          }
        : undefined,
    )
    setDateTime(toLocalDateTime(transaction.transactionTime))
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
      if (decimal?.length === 2 || current.replace('.', '').length >= 9) return current
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

    const transactionDate = new Date(dateTime)
    if (Number.isNaN(transactionDate.getTime())) {
      toast.info('请选择有效的交易时间')
      return
    }

    savingRef.current = true
    setIsSaving(true)
    try {
      const relatedResource = type === 'transfer'
        ? { targetAccountId: targetAccount!.id }
        : { categoryId: category!.id }
      const payload: CreateTransactionPayload = {
        transactionType: type === 'expense' ? 1 : type === 'income' ? 2 : 3,
        amount: cents,
        ...relatedResource,
        accountId: account.id,
        currency: 'CNY',
        transactionTime: transactionDate.toISOString(),
        remark: note.trim() || undefined,
      }
      if (isEditing) await updateTransaction(transactionId!, payload)
      else await createTransaction(payload)
      toast.success(isEditing ? '修改成功' : '记账成功')
      navigate(returnTo, {
        state: returnTo === '/flow' ? { refreshFlow: true } : undefined,
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
    const categories = visibleType === 'income' ? incomeCategories : expenseCategories
    const categoryError = visibleType === 'income' ? incomeCategoryError : expenseCategoryError

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
    ? dateTime.replace(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/, '$1年$2月$3日  $4:$5')
    : '请选择'
  const accountValue = account?.name ?? (isLoadingResources ? '加载中…' : accountError ? '加载失败' : '暂无可用账户')
  const isInteractionDisabled =
    isSaving || (isEditing && !isDetailHydrated)

  return (
    <main className="tally-page tally-entry-page">
      <div className="tally-page__content">
        <TallyHeader title={isEditing ? '编辑流水' : '记一笔'} onBack={() => navigate(returnTo)} />
        <TypeSegment disabled={isInteractionDisabled} value={type} onChange={handleTypeChange} />
        <AmountEditor amount={amount} disabled={isInteractionDisabled} onClear={() => setAmount('')} />

        {isLoadingDetail && (
          <p className="tally-status" role="status">正在加载流水详情…</p>
        )}
        {detailError && (
          <div className="tally-detail-error" role="alert">
            <p>{detailError}</p>
            {isValidTransactionId && (
              <button type="button" onClick={() => setDetailRetryKey((key) => key + 1)}>
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
              value={category?.label ?? (isLoadingResources ? '加载中…' : '请选择')}
              muted={!category}
              disabled={isInteractionDisabled}
              onClick={() => navigate(`${tallyPath}/category`, { state: location.state })}
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
          {type === 'transfer' && (
            <FormRow
              icon={<WalletCards size={23} strokeWidth={1.8} />}
              label="转入账户"
              value={targetAccount?.name ?? (isLoadingResources ? '加载中…' : '请选择')}
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
            onClick={() => dateInputRef.current?.showPicker()}
          />
          <label className="tally-form-row tally-note-row">
            <span className="tally-form-row__icon"><NotebookPen size={23} strokeWidth={1.8} /></span>
            <span className="tally-form-row__label">备注</span>
            <input aria-label="备注" disabled={isInteractionDisabled} placeholder="添加备注（选填）" value={note} onChange={(event) => setNote(event.target.value)} />
          </label>
          <input
            className="tally-date-input"
            ref={dateInputRef}
            type="datetime-local"
            value={dateTime}
            disabled={isInteractionDisabled}
            onChange={(event) => setDateTime(event.target.value)}
            tabIndex={-1}
            aria-hidden="true"
          />
        </section>
      </div>

      <footer className="tally-entry-footer">
        <NumericKeyboard
          disabled={isInteractionDisabled}
          onInput={handleAmountInput}
          onDelete={() => setAmount((current) => current.slice(0, -1))}
        />
        <button className="tally-save" disabled={isInteractionDisabled} type="button" onClick={() => void handleSave()}>
          {isSaving ? '保存中…' : '保存'}
        </button>
      </footer>

      {accountPicker && (
        <AccountSheet
          accounts={accounts}
          loading={isLoadingResources}
          selected={accountPicker === 'account' ? account : targetAccount}
          excludeId={type === 'transfer' ? (accountPicker === 'account' ? targetAccount?.id : account?.id) : undefined}
          title={accountPicker === 'target' ? '选择转入账户' : '选择账户'}
          onClose={() => setAccountPicker(undefined)}
          onSelect={(nextAccount) => {
            if (accountPicker === 'target') setTargetAccount(nextAccount)
            else setAccount(nextAccount)
            setAccountPicker(undefined)
          }}
        />
      )}
    </main>
  )
}
