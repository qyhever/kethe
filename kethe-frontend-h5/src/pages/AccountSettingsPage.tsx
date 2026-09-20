import {
  BadgeDollarSign,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Coins,
  CreditCard,
  Globe2,
  HandCoins,
  Landmark,
  LoaderCircle,
  MessageCircle,
  PiggyBank,
  Plus,
  RotateCcw,
  ScanLine,
  Ticket,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createAccount,
  fetchAccountOptions,
  fetchAccounts,
  updateAccount,
} from '../api/ledger'
import type {
  AccountOptions,
  AccountPayload,
  AccountTypeOption,
  LedgerAccount,
} from '../api/types'
import { useToast } from '../components/Toast'
import './AccountSettingsPage.css'

type PageMode = 'list' | 'form'

interface AccountForm {
  id?: string
  name: string
  accountType: number
  accountSubType: number | ''
  accountNature: 1 | 2
  initialAmount: string
  institutionName: string
  accountNumberLast4: string
  creditLimit: string
  iconKey: string
  includeInNetWorth: boolean
  remark: string
}

const CASH_VOUCHER = 402

const ACCOUNT_ICON_COMPONENTS: Record<string, LucideIcon> = {
  cash: Banknote,
  'credit-card': CreditCard,
  'consumer-credit': HandCoins,
  'bank-card': Landmark,
  savings: PiggyBank,
  wallet: WalletCards,
  wechat: MessageCircle,
  alipay: ScanLine,
  paypal: Globe2,
  'stored-value-card': BadgeDollarSign,
  voucher: Ticket,
  coins: Coins,
}

function accountIcon(iconKey: string | null) {
  return (iconKey && ACCOUNT_ICON_COMPONENTS[iconKey]) || WalletCards
}

function iconOptionsFor(options: AccountOptions | null, accountType: number) {
  return (
    options?.accountIcons.filter((item) =>
      item.supportedTypes.includes(accountType),
    ) ?? []
  )
}

function formatCents(value: string) {
  const cents = BigInt(value || '0')
  const sign = cents < 0n ? '-' : ''
  const absolute = cents < 0n ? -cents : cents
  return `${sign}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`
}

function yuanToCents(value: string) {
  const matched = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim())
  if (!matched) return null
  return (
    BigInt(matched[1]) * 100n +
    BigInt((matched[2] ?? '').padEnd(2, '0') || '0')
  ).toString()
}

function optionFor(options: AccountOptions | null, accountType: number) {
  return options?.accountTypes.find((item) => item.value === accountType)
}

export function AccountSettingsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [accounts, setAccounts] = useState<LedgerAccount[]>([])
  const [options, setOptions] = useState<AccountOptions | null>(null)
  const [mode, setMode] = useState<PageMode>('list')
  const [form, setForm] = useState<AccountForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true)
      setError('')
      try {
        const [nextAccounts, nextOptions] = await Promise.all([
          fetchAccounts(),
          options ? Promise.resolve(options) : fetchAccountOptions(),
        ])
        setAccounts(nextAccounts)
        setOptions(nextOptions)
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : '加载账户失败')
      } finally {
        setLoading(false)
      }
    },
    [options],
  )

  useEffect(() => {
    void load()
    // 账户类型元数据首次加载后复用。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const newForm = () => {
    const type = options?.accountTypes[0]
    if (!type) return
    setForm({
      name: '',
      accountType: type.value,
      accountSubType: type.subTypes[0]?.value ?? '',
      accountNature: type.defaultNature ?? 1,
      initialAmount: '',
      institutionName: '',
      accountNumberLast4: '',
      creditLimit: '',
      iconKey: iconOptionsFor(options, type.value)[0]?.key ?? '',
      includeInNetWorth: true,
      remark: '',
    })
    setMode('form')
  }

  const editForm = (account: LedgerAccount) => {
    setForm({
      id: account.id,
      name: account.name,
      accountType: account.accountType,
      accountSubType: account.accountSubType ?? '',
      accountNature: account.accountNature,
      initialAmount: formatCents(
        account.accountNature === 2
          ? BigInt(account.initialBalance) < 0n
            ? (-BigInt(account.initialBalance)).toString()
            : '0'
          : account.initialBalance,
      ),
      institutionName: account.institutionName ?? '',
      accountNumberLast4: account.accountNumberLast4 ?? '',
      creditLimit: account.creditLimit ? formatCents(account.creditLimit) : '',
      iconKey:
        account.iconKey ??
        iconOptionsFor(options, account.accountType)[0]?.key ??
        '',
      includeInNetWorth: account.includeInNetWorth,
      remark: account.remark ?? '',
    })
    setMode('form')
  }

  const changeType = (type: AccountTypeOption) => {
    if (!form) return
    const accountSubType = type.subTypes[0]?.value ?? ''
    setForm({
      ...form,
      accountType: type.value,
      accountSubType,
      accountNature: type.defaultNature ?? 1,
      institutionName: type.supportsInstitution ? form.institutionName : '',
      accountNumberLast4: '',
      creditLimit: type.supportsCreditLimit ? form.creditLimit : '',
      iconKey: iconOptionsFor(options, type.value)[0]?.key ?? '',
      includeInNetWorth: accountSubType !== CASH_VOUCHER,
    })
  }

  const save = async () => {
    if (!form) return
    const selectedType = optionFor(options, form.accountType)
    if (!form.name.trim()) return void toast.warning('请输入账户名称')
    if (!selectedType) return void toast.warning('请选择账户类型')
    if (selectedType.subTypes.length && form.accountSubType === '') {
      return void toast.warning('请选择账户子类型')
    }
    const initial = yuanToCents(form.initialAmount || '0')
    if (initial === null)
      return void toast.warning('请输入正确的初始金额，最多两位小数')
    const creditLimit = form.creditLimit ? yuanToCents(form.creditLimit) : null
    if (form.creditLimit && creditLimit === null) {
      return void toast.warning('请输入正确的信用额度，最多两位小数')
    }
    const selectedSubType = selectedType.subTypes.find(
      (item) => item.value === form.accountSubType,
    )
    if (
      selectedSubType?.supportsLast4 &&
      form.accountNumberLast4 &&
      !/^\d{4}$/.test(form.accountNumberLast4)
    ) {
      return void toast.warning('账号后四位必须是四位数字')
    }

    const payload: AccountPayload = {
      name: form.name.trim(),
      accountType: form.accountType,
      initialBalance:
        form.accountNature === 2 && initial !== '0' ? `-${initial}` : initial,
      includeInNetWorth: form.includeInNetWorth,
      remark: form.remark.trim(),
      iconKey: form.iconKey,
    }
    if (form.accountSubType !== '') payload.accountSubType = form.accountSubType
    if (selectedType.requiresNature) payload.accountNature = form.accountNature
    if (selectedType.supportsInstitution) {
      payload.institutionName = form.institutionName.trim() || null
    }
    if (selectedSubType?.supportsLast4) {
      payload.accountNumberLast4 = form.accountNumberLast4 || null
    }
    if (selectedType.supportsCreditLimit) {
      payload.creditLimit = creditLimit
    }

    setSaving(true)
    try {
      if (form.id) await updateAccount(form.id, payload)
      else await createAccount(payload)
      toast.success(form.id ? '账户已更新' : '账户已添加')
      await load(true)
      setMode('list')
      setForm(null)
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (mode === 'form' && form) {
    const selectedType = optionFor(options, form.accountType)
    const selectedSubType = selectedType?.subTypes.find(
      (item) => item.value === form.accountSubType,
    )
    const isLiability = form.accountNature === 2
    return (
      <main className="account-settings account-settings--form">
        <PageHeader
          title={form.id ? '编辑账户' : '新增账户'}
          onBack={() => {
            setMode('list')
            setForm(null)
          }}
        />
        <section className="account-settings__form">
          <Field label="账户名称">
            <input
              value={form.name}
              maxLength={50}
              placeholder="例如：招商银行储蓄卡"
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
            />
          </Field>
          <Field label="一级类型" select>
            <select
              value={form.accountType}
              onChange={(event) => {
                const type = options?.accountTypes.find(
                  (item) => item.value === Number(event.target.value),
                )
                if (type) changeType(type)
              }}
            >
              {options?.accountTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronRight size={19} />
          </Field>
          {selectedType && selectedType.subTypes.length > 0 && (
            <Field label="子类型" select>
              <select
                value={form.accountSubType}
                onChange={(event) => {
                  const accountSubType = Number(event.target.value)
                  setForm({
                    ...form,
                    accountSubType,
                    accountNumberLast4: '',
                    includeInNetWorth: accountSubType !== CASH_VOUCHER,
                  })
                }}
              >
                {selectedType.subTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronRight size={19} />
            </Field>
          )}
          <section className="account-settings__field">
            <span>账户图标</span>
            <div
              className="account-settings__icon-picker"
              role="radiogroup"
              aria-label="账户图标"
            >
              {iconOptionsFor(options, form.accountType).map((item) => {
                const Icon = accountIcon(item.key)
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={form.iconKey === item.key}
                    className={form.iconKey === item.key ? 'is-selected' : ''}
                    key={item.key}
                    onClick={() => setForm({ ...form, iconKey: item.key })}
                  >
                    <Icon size={23} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </section>
          {selectedType?.requiresNature && (
            <Field label="账户性质" select>
              <select
                value={form.accountNature}
                onChange={(event) =>
                  setForm({
                    ...form,
                    accountNature: Number(event.target.value) as 1 | 2,
                  })
                }
              >
                <option value={1}>资产</option>
                <option value={2}>负债</option>
              </select>
              <ChevronRight size={19} />
            </Field>
          )}
          {selectedType?.supportsInstitution && (
            <Field label="机构名称">
              <input
                value={form.institutionName}
                maxLength={100}
                placeholder="银行或服务商（选填）"
                onChange={(event) =>
                  setForm({ ...form, institutionName: event.target.value })
                }
              />
            </Field>
          )}
          {selectedSubType?.supportsLast4 && (
            <Field label="账号后四位">
              <input
                value={form.accountNumberLast4}
                inputMode="numeric"
                maxLength={4}
                placeholder="仅保存后四位（选填）"
                onChange={(event) =>
                  setForm({
                    ...form,
                    accountNumberLast4: event.target.value
                      .replace(/\D/g, '')
                      .slice(0, 4),
                  })
                }
              />
            </Field>
          )}
          {selectedType?.supportsCreditLimit && (
            <Field label="信用额度">
              <MoneyInput
                value={form.creditLimit}
                placeholder="选填"
                onChange={(creditLimit) => setForm({ ...form, creditLimit })}
              />
            </Field>
          )}
          <Field
            label={isLiability ? '初始欠款' : '初始余额'}
            hint={isLiability ? '请输入正数，系统会按负债记账' : undefined}
          >
            <MoneyInput
              value={form.initialAmount}
              placeholder="0.00"
              onChange={(initialAmount) => setForm({ ...form, initialAmount })}
            />
          </Field>
          <label className="account-settings__toggle">
            <span>
              <strong>计入净资产</strong>
              <small>关闭后不参与净资产统计</small>
            </span>
            <input
              type="checkbox"
              checked={form.includeInNetWorth}
              onChange={(event) =>
                setForm({ ...form, includeInNetWorth: event.target.checked })
              }
            />
          </label>
          <Field label="备注">
            <textarea
              value={form.remark}
              maxLength={255}
              placeholder="选填"
              onChange={(event) =>
                setForm({ ...form, remark: event.target.value })
              }
            />
          </Field>
        </section>
        <div className="account-settings__footer">
          <button type="button" disabled={saving} onClick={() => void save()}>
            {saving && <LoaderCircle className="is-spinning" size={19} />}
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="account-settings">
      <PageHeader title="账户设置" onBack={() => navigate('/profile')} />
      <p className="account-settings__intro">
        管理资产与负债账户，信用账户欠款会根据当前余额自动计算
      </p>
      <section className="account-settings__list" aria-live="polite">
        {loading ? (
          <Status>
            <LoaderCircle className="is-spinning" />
            加载中…
          </Status>
        ) : error ? (
          <Status>
            <p>{error}</p>
            <button type="button" onClick={() => void load()}>
              <RotateCcw size={17} />
              重新加载
            </button>
          </Status>
        ) : accounts.length === 0 ? (
          <Status>
            <p>还没有账户</p>
            <span>点击下方按钮创建第一个账户</span>
          </Status>
        ) : (
          accounts.map((account) => {
            const type = optionFor(options, account.accountType)
            const subType = type?.subTypes.find(
              (item) => item.value === account.accountSubType,
            )
            const Icon = accountIcon(account.iconKey)
            return (
              <button
                className="account-settings__row"
                type="button"
                key={account.id}
                onClick={() => editForm(account)}
              >
                <span
                  className={`account-settings__icon account-settings__icon--${account.accountNature === 2 ? 'liability' : 'asset'}`}
                >
                  <Icon size={25} />
                </span>
                <span className="account-settings__copy">
                  <strong>{account.name}</strong>
                  <small>
                    {[type?.label, subType?.label, account.institutionName]
                      .filter(Boolean)
                      .join(' · ')}
                  </small>
                </span>
                <span className="account-settings__amount">
                  <strong>
                    {account.accountNature === 2
                      ? `欠款 ¥${formatCents(account.outstandingDebt)}`
                      : `¥${formatCents(account.currentBalance)}`}
                  </strong>
                  {!account.includeInNetWorth && <small>不计入净资产</small>}
                </span>
                <ChevronRight size={19} />
              </button>
            )
          })
        )}
      </section>
      <div className="account-settings__footer">
        <button
          type="button"
          disabled={loading || Boolean(error)}
          onClick={newForm}
        >
          <Plus size={23} />
          新增账户
        </button>
      </div>
    </main>
  )
}

function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="account-settings__header">
      <button type="button" aria-label="返回" onClick={onBack}>
        <ChevronLeft />
      </button>
      <h1>{title}</h1>
      <span />
    </header>
  )
}

function Field({
  label,
  hint,
  select,
  children,
}: {
  label: string
  hint?: string
  select?: boolean
  children: React.ReactNode
}) {
  return (
    <label
      className={`account-settings__field${select ? ' account-settings__field--select' : ''}`}
    >
      <span>{label}</span>
      <div>{children}</div>
      {hint && <small>{hint}</small>}
    </label>
  )
}

function MoneyInput({
  value,
  placeholder,
  onChange,
}: {
  value: string
  placeholder: string
  onChange: (value: string) => void
}) {
  return (
    <span className="account-settings__money">
      <b>¥</b>
      <input
        value={value}
        inputMode="decimal"
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value.replace(/[^\d.]/g, ''))
        }
      />
    </span>
  )
}

function Status({ children }: { children: React.ReactNode }) {
  return <div className="account-settings__status">{children}</div>
}
