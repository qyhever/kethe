import { AlertCircle, Check, ChevronDown, ChevronRight, Circle, Edit3, Ellipsis, LoaderCircle, Plus, Power, RotateCcw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createAccount, fetchAccount, fetchAccountOptions, fetchAccounts, removeAccount, updateAccount } from '../api/ledger'
import type { AccountOptions, AccountTypeOption, CreateAccountPayload, LedgerAccount, UpdateAccountPayload } from '../api/types'
import { AccountHeader, AccountIcon, AccountIconSheet, AccountRow, Money } from '../components/Account/AccountUI'
import { Dialog } from '../components/Dialog/Dialog'
import { useToast } from '../components/Toast'
import './AccountSettingsPage.css'

const CASH_VOUCHER = 402
const errorMessage = (error: unknown, fallback: string) => error instanceof Error ? error.message : fallback
const optionFor = (options: AccountOptions | null, type: number) => options?.accountTypes.find((item) => item.value === type)
const addMoney = (items: LedgerAccount[], selector: (item: LedgerAccount) => string) => items.reduce((total, item) => total + BigInt(selector(item)), 0n).toString()

function useAccountOptions() {
  const [options, setOptions] = useState<AccountOptions | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setError('')
    try { setOptions(await fetchAccountOptions()) } catch (caught) { setError(errorMessage(caught, '加载账户选项失败')) }
  }, [])
  useEffect(() => void load(), [load])
  return { options, error, reload: load }
}

export function AccountSettingsPage() {
  const navigate = useNavigate()
  const { options } = useAccountOptions()
  const [accounts, setAccounts] = useState<LedgerAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setAccounts(await fetchAccounts()) } catch (caught) { setError(errorMessage(caught, '加载账户失败')) } finally { setLoading(false) }
  }, [])
  useEffect(() => void load(), [load])
  const active = accounts.filter((item) => item.isEnabled)
  const assets = active.filter((item) => item.accountNature === 1)
  const liabilities = active.filter((item) => item.accountNature === 2)
  const disabled = accounts.filter((item) => !item.isEnabled)
  const assetTotal = addMoney(assets, (item) => item.currentBalance)
  const liabilityTotal = addMoney(liabilities, (item) => item.outstandingDebt)
  const netWorth = (BigInt(addMoney(assets.filter((item) => item.includeInNetWorth), (item) => item.currentBalance)) - BigInt(addMoney(liabilities.filter((item) => item.includeInNetWorth), (item) => item.outstandingDebt))).toString()
  const renderGroup = (title: string, items: LedgerAccount[]) => items.length > 0 && (
    <section className="account-group">
      <h2>{title} <small>({items.length})</small></h2>
      <div className="account-group__card">{items.map((account) => {
        const type = optionFor(options, account.accountType)
        const subType = type?.subTypes.find((item) => item.value === account.accountSubType)
        return <AccountRow key={account.id} account={account} typeLabel={type?.label} subTypeLabel={subType?.label} onClick={() => navigate(`/profile/accounts/${account.id}`)} />
      })}</div>
    </section>
  )
  return (
    <main className="account-page account-list-page">
      <AccountHeader title="账户设置" onBack={() => navigate('/profile')} action={<button type="button" aria-label="新增账户" onClick={() => navigate('/profile/accounts/new')}><Plus /></button>} />
      {!loading && !error && accounts.length > 0 && <section className="account-summary"><span>净资产 <AlertCircle size={13} /></span><strong><Money cents={netWorth} /></strong><div><span>资产合计<strong><Money cents={assetTotal} /></strong></span><span>负债合计<strong><Money cents={liabilityTotal} /></strong></span></div></section>}
      <div className="account-page__content" aria-live="polite">{loading ? <PageStatus loading text="正在加载账户…" /> : error ? <PageStatus text={error} retry={load} /> : accounts.length === 0 ? <PageStatus text="还没有账户" secondary="创建账户后，资产与负债会在这里汇总" /> : <>{renderGroup('资产账户', assets)}{renderGroup('负债账户', liabilities)}{renderGroup('已停用账户', disabled)}</>}</div>
      <BottomAction onClick={() => navigate('/profile/accounts/new')}><Plus />新增账户</BottomAction>
    </main>
  )
}

export function AccountCreatePage({ details = false }: { details?: boolean }) {
  const navigate = useNavigate()
  const [search] = useSearchParams()
  const { options, error, reload } = useAccountOptions()
  const selectedType = optionFor(options, Number(search.get('type')))
  const [expanded, setExpanded] = useState<number | null>(null)
  const [selectedSubType, setSelectedSubType] = useState<number | ''>('')
  useEffect(() => {
    if (!options || expanded !== null) return
    const first = options.accountTypes[0]
    setExpanded(first?.value ?? null); setSelectedSubType(first?.subTypes[0]?.value ?? '')
  }, [expanded, options])
  if (error) return <main className="account-page"><AccountHeader title="新增账户" onBack={() => navigate(-1)} /><PageStatus text={error} retry={reload} /></main>
  if (!options) return <main className="account-page"><AccountHeader title="新增账户" onBack={() => navigate(-1)} /><PageStatus loading text="正在加载…" /></main>
  if (details && selectedType) return <AccountFormPage options={options} selectedType={selectedType} initialSubType={selectedType.subTypes.some((item) => item.value === Number(search.get('subType'))) ? Number(search.get('subType')) : selectedType.subTypes[0]?.value ?? ''} onBack={() => navigate(-1)} />
  const next = () => {
    if (expanded === null) return
    const type = optionFor(options, expanded)
    if (!type) return
    const subType = type.subTypes.length ? selectedSubType : ''
    navigate(`/profile/accounts/new/details?type=${type.value}${subType !== '' ? `&subType=${subType}` : ''}`)
  }
  return (
    <main className="account-page account-create-page">
      <AccountHeader title="新增账户" onBack={() => navigate(-1)} /><Steps current={1} />
      <section className="account-type-list">{options.accountTypes.map((type) => {
        const open = expanded === type.value
        return <article key={type.value} className={open ? 'is-open' : ''}>
          <button type="button" className="account-type-list__heading" onClick={() => { setExpanded(type.value); setSelectedSubType(type.subTypes[0]?.value ?? '') }}>
            <AccountIcon iconKey={options.accountIcons.find((icon) => icon.supportedTypes.includes(type.value))?.key ?? null} nature={type.defaultNature ?? 1} /><span><strong>{type.label}</strong><small>{type.remark ?? (type.value === 1 ? '用于记录纸币、硬币等现金资产' : '根据实际情况选择资产或负债')}</small></span>{type.subTypes.length ? <ChevronDown /> : open ? <Check /> : <ChevronRight />}
          </button>
          {open && type.subTypes.length > 0 && <div className="account-type-list__subs">{type.subTypes.map((subType) => <button type="button" key={subType.value} onClick={() => setSelectedSubType(subType.value)}><span className={selectedSubType === subType.value ? 'is-selected' : ''}>{selectedSubType === subType.value ? <Check size={13} /> : <Circle size={13} />}</span><span><strong>{subType.label}</strong><small>{subType.supportsLast4 ? '支持设置账号后四位' : '适合无实体卡号的账户'}</small></span></button>)}</div>}
        </article>
      })}</section>
      <BottomAction onClick={next}>下一步</BottomAction>
    </main>
  )
}

function Steps({ current }: { current: 1 | 2 }) {
  return <div className="account-steps"><span className="is-active"><b>1</b>选择类型</span><i className={current === 2 ? 'is-active' : ''} /><span className={current === 2 ? 'is-active' : ''}><b>2</b>填写信息</span></div>
}

export function AccountDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { options } = useAccountOptions()
  const [account, setAccount] = useState<LedgerAccount | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<'toggle' | 'delete' | null>(null)
  const [acting, setActing] = useState(false)
  const load = useCallback(async () => { setLoading(true); setError(''); try { setAccount(await fetchAccount(id)) } catch (caught) { setError(errorMessage(caught, '加载账户失败')) } finally { setLoading(false) } }, [id])
  useEffect(() => void load(), [load])
  if (loading) return <main className="account-page"><AccountHeader title="账户详情" onBack={() => navigate(-1)} /><PageStatus loading text="正在加载…" /></main>
  if (error || !account) return <main className="account-page"><AccountHeader title="账户详情" onBack={() => navigate(-1)} /><PageStatus text={error || '账户不存在'} retry={load} /></main>
  const type = optionFor(options, account.accountType)
  const subType = type?.subTypes.find((item) => item.value === account.accountSubType)
  const availableCredit = account.creditLimit ? (BigInt(account.creditLimit) - BigInt(account.outstandingDebt) < 0n ? 0n : BigInt(account.creditLimit) - BigInt(account.outstandingDebt)).toString() : null
  const toggle = async () => { setActing(true); try { const next = await updateAccount(account.id, { isEnabled: !account.isEnabled }); setAccount(next); setDialog(null); toast.success(account.isEnabled ? '账户已停用' : '账户已重新启用') } catch (caught) { toast.error(errorMessage(caught, '操作失败')) } finally { setActing(false) } }
  const remove = async () => { setActing(true); try { await removeAccount(account.id); toast.success('账户已删除'); navigate('/profile/accounts', { replace: true }) } catch (caught) { toast.error(errorMessage(caught, '删除失败')) } finally { setActing(false) } }
  return (
    <main className="account-page account-detail-page">
      <AccountHeader title="账户详情" onBack={() => navigate(-1)} action={<Ellipsis />} />
      <section className="account-detail__identity"><AccountIcon iconKey={account.iconKey} nature={account.accountNature} size={28} /><div><strong>{account.name}</strong><small>{account.accountNumberLast4 ? `尾号 ${account.accountNumberLast4}` : type?.label}</small></div>{!account.includeInNetWorth && <em>不计入净资产</em>}</section>
      <section className="account-detail__balance"><span>{account.accountNature === 2 ? '当前欠款' : '当前余额'} <AlertCircle size={13} /></span><strong><Money cents={account.accountNature === 2 ? account.outstandingDebt : account.currentBalance} /></strong>{account.creditLimit && <div><span>信用额度<strong><Money cents={account.creditLimit} /></strong></span><span>可用额度<strong><Money cents={availableCredit ?? '0'} /></strong></span></div>}</section>
      <DetailSection title="账户信息" rows={[
        ['账户类型', [type?.label, subType?.label].filter(Boolean).join(' / ')], ['账户性质', account.accountNature === 2 ? '负债' : '资产'],
        ...(account.institutionName ? [['机构名称', account.institutionName]] : []), ...(account.accountNumberLast4 ? [['账号尾号', account.accountNumberLast4]] : []), ...(account.creditLimit ? [['信用额度', `¥ ${(Number(account.creditLimit) / 100).toFixed(2)}`]] : []), ['是否计入净资产', account.includeInNetWorth ? '是' : '否'], ['备注', account.remark || '无'],
      ]} />
      <section className="account-detail__status"><h2>状态</h2><p><i className={account.isEnabled ? '' : 'is-disabled'} />{account.isEnabled ? '使用中' : '已停用'}</p></section>
      <div className="account-detail__actions"><button type="button" onClick={() => navigate(`/profile/accounts/${account.id}/edit`)}><Edit3 />编辑账户</button><button type="button" className="is-danger" onClick={() => setDialog('toggle')}><Power />{account.isEnabled ? '停用账户' : '重新启用'}</button><button type="button" className="is-danger" onClick={() => { if (account.hasTransactions || account.isSystemDefault) toast.warning('该账户已有流水或为系统账户，只能停用'); else setDialog('delete') }}><Trash2 />删除账户</button></div>
      <Dialog open={dialog === 'toggle'} title={account.isEnabled ? '确认停用账户？' : '确认重新启用账户？'} description={account.isEnabled ? '停用后不能再用于新记账，历史流水不会受到影响。' : '重新启用后，可继续使用此账户记账。'} confirmText={account.isEnabled ? '确认停用' : '确认启用'} danger={account.isEnabled} loading={acting} onCancel={() => setDialog(null)} onConfirm={toggle} />
      <Dialog open={dialog === 'delete'} title="确认删除账户？" description="删除后无法恢复，请确认该账户不再需要。" confirmText="确认删除" danger loading={acting} onCancel={() => setDialog(null)} onConfirm={remove} />
    </main>
  )
}

function DetailSection({ title, rows }: { title: string; rows: string[][] }) { return <section className="account-detail__info"><h2>{title}</h2>{rows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</section> }

export function AccountEditPage() {
  const { id = '' } = useParams(); const navigate = useNavigate(); const { options, error: optionsError, reload } = useAccountOptions()
  const [account, setAccount] = useState<LedgerAccount | null>(null); const [error, setError] = useState('')
  useEffect(() => { void fetchAccount(id).then(setAccount).catch((caught) => setError(errorMessage(caught, '加载账户失败'))) }, [id])
  if (error || optionsError) return <main className="account-page"><AccountHeader title="编辑账户" onBack={() => navigate(-1)} /><PageStatus text={error || optionsError} retry={error ? undefined : reload} /></main>
  if (!options || !account) return <main className="account-page"><AccountHeader title="编辑账户" onBack={() => navigate(-1)} /><PageStatus loading text="正在加载…" /></main>
  return <AccountFormPage options={options} selectedType={optionFor(options, account.accountType)!} initialSubType={account.accountSubType ?? ''} account={account} onBack={() => navigate(-1)} />
}

interface FormState { name: string; accountType: number; accountSubType: number | ''; accountNature: 1 | 2; initialAmount: string; institutionName: string; accountNumberLast4: string; creditLimit: string; iconKey: string; includeInNetWorth: boolean; remark: string }
function centsToYuan(value: string) { const amount = BigInt(value || '0'); const absolute = amount < 0n ? -amount : amount; return `${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}` }
function yuanToCents(value: string) { const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(value.trim()); return match ? (BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0') || '0')).toString() : null }

function AccountFormPage({ options, selectedType, initialSubType, account, onBack }: { options: AccountOptions; selectedType: AccountTypeOption; initialSubType: number | ''; account?: LedgerAccount; onBack: () => void }) {
  const navigate = useNavigate(); const toast = useToast(); const [saving, setSaving] = useState(false); const [iconOpen, setIconOpen] = useState(false)
  const [form, setForm] = useState<FormState>(() => ({ name: account?.name ?? '', accountType: selectedType.value, accountSubType: account?.accountSubType ?? initialSubType, accountNature: account?.accountNature ?? selectedType.defaultNature ?? 1, initialAmount: account ? centsToYuan(account.initialBalance) : '', institutionName: account?.institutionName ?? '', accountNumberLast4: account?.accountNumberLast4 ?? '', creditLimit: account?.creditLimit ? centsToYuan(account.creditLimit) : '', iconKey: account?.iconKey ?? options.accountIcons.find((icon) => icon.supportedTypes.includes(selectedType.value))?.key ?? '', includeInNetWorth: account?.includeInNetWorth ?? initialSubType !== CASH_VOUCHER, remark: account?.remark ?? '' }))
  const type = optionFor(options, form.accountType)!; const subType = type.subTypes.find((item) => item.value === form.accountSubType); const locked = Boolean(account?.hasTransactions); const icons = options.accountIcons.filter((icon) => icon.supportedTypes.includes(form.accountType)); const submitLock = useRef(false)
  const changeType = (value: number) => { const next = optionFor(options, value); if (!next) return; const subtype = next.subTypes[0]?.value ?? ''; setForm((current) => ({ ...current, accountType: value, accountSubType: subtype, accountNature: next.defaultNature ?? current.accountNature, institutionName: next.supportsInstitution ? current.institutionName : '', accountNumberLast4: '', creditLimit: next.supportsCreditLimit ? current.creditLimit : '', iconKey: options.accountIcons.find((icon) => icon.supportedTypes.includes(value))?.key ?? '', includeInNetWorth: subtype !== CASH_VOUCHER })) }
  const save = async () => {
    if (submitLock.current) return
    if (!form.name.trim()) return void toast.warning('请输入账户名称')
    if (!form.initialAmount.trim()) return void toast.warning(form.accountNature === 2 ? '请输入初始欠款' : '请输入初始余额')
    if (type.supportsCreditLimit && !form.creditLimit.trim()) return void toast.warning('请输入信用额度')
    const initial = yuanToCents(form.initialAmount || '0'); if (initial === null) return void toast.warning('初始金额格式不正确，最多保留两位小数')
    const credit = form.creditLimit ? yuanToCents(form.creditLimit) : null; if (form.creditLimit && credit === null) return void toast.warning('信用额度格式不正确，最多保留两位小数')
    if (subType?.supportsLast4 && form.accountNumberLast4 && !/^\d{4}$/.test(form.accountNumberLast4)) return void toast.warning('账号后四位必须是四位数字')
    if (credit && BigInt(initial) > BigInt(credit)) return void toast.warning('初始欠款不能大于信用额度')
    const base: CreateAccountPayload = { name: form.name.trim(), accountType: form.accountType, initialBalance: form.accountNature === 2 && initial !== '0' ? `-${initial}` : initial, includeInNetWorth: form.includeInNetWorth, iconKey: form.iconKey, remark: form.remark.trim(), currency: 'CNY' }
    if (form.accountSubType !== '') base.accountSubType = form.accountSubType; if (type.requiresNature) base.accountNature = form.accountNature; if (type.supportsInstitution) base.institutionName = form.institutionName.trim() || null; if (subType?.supportsLast4) base.accountNumberLast4 = form.accountNumberLast4 || null; if (type.supportsCreditLimit) base.creditLimit = credit
    submitLock.current = true; setSaving(true)
    try {
      if (account) { const payload = { ...base } as UpdateAccountPayload & { currency?: string }; delete payload.currency; if (locked) { delete payload.accountType; delete payload.accountNature; delete payload.initialBalance }; await updateAccount(account.id, payload); toast.success('账户已更新'); navigate(`/profile/accounts/${account.id}`, { replace: true }) }
      else { await createAccount(base); toast.success('账户已添加'); navigate('/profile/accounts', { replace: true }) }
    } catch (caught) { toast.error(errorMessage(caught, '保存失败')); submitLock.current = false; setSaving(false) }
  }
  return (
    <main className="account-page account-form-page">
      <AccountHeader title={account ? '编辑账户' : '新增账户'} onBack={onBack} />{!account && <Steps current={2} />}
      <section className="account-form">
        <button type="button" className="account-form__icon" onClick={() => setIconOpen(true)}><AccountIcon iconKey={form.iconKey} nature={form.accountNature} size={28} /><span>{account ? '更换图标' : '选择图标'}</span></button>
        <FormField label="账户名称" required count={`${form.name.length}/50`}><input maxLength={50} value={form.name} placeholder="例如：招商信用卡" onChange={(event) => setForm({ ...form, name: event.target.value })} /></FormField>
        {account && <FormField label="一级类型" hint={locked ? '该账户已有流水，一级类型不可修改' : undefined}><select disabled={locked} value={form.accountType} onChange={(event) => changeType(Number(event.target.value))}>{options.accountTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></FormField>}
        {type.subTypes.length > 0 && <FormField label="账户子类型"><select value={form.accountSubType} onChange={(event) => { const value = Number(event.target.value); setForm({ ...form, accountSubType: value, accountNumberLast4: '', includeInNetWorth: value !== CASH_VOUCHER }) }}>{type.subTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></FormField>}
        {type.requiresNature && <FormField label="账户性质" hint={locked ? '该账户已有流水，账户性质不可修改' : undefined}><select disabled={locked} value={form.accountNature} onChange={(event) => setForm({ ...form, accountNature: Number(event.target.value) as 1 | 2 })}><option value={1}>资产</option><option value={2}>负债</option></select></FormField>}
        {type.supportsInstitution && <FormField label="机构名称"><input maxLength={100} value={form.institutionName} placeholder="请输入机构名称（选填）" onChange={(event) => setForm({ ...form, institutionName: event.target.value })} /></FormField>}
        {subType?.supportsLast4 && <FormField label="账号后四位"><input inputMode="numeric" maxLength={4} value={form.accountNumberLast4} placeholder="请输入账号后四位（选填）" onChange={(event) => setForm({ ...form, accountNumberLast4: event.target.value.replace(/\D/g, '').slice(0, 4) })} /></FormField>}
        {type.supportsCreditLimit && <FormField label="信用额度" required><MoneyField value={form.creditLimit} placeholder="0.00" onChange={(value) => setForm({ ...form, creditLimit: value })} /></FormField>}
        <FormField label={form.accountNature === 2 ? '初始欠款' : '初始余额'} required hint={locked ? `该账户已有流水，${form.accountNature === 2 ? '初始欠款' : '初始余额'}不可修改` : undefined}><MoneyField disabled={locked} value={form.initialAmount} placeholder="0.00" onChange={(value) => setForm({ ...form, initialAmount: value })} /></FormField>
        <label className="account-form__toggle"><span><strong>是否计入净资产</strong><small>{form.accountNature === 2 ? '该账户为负债，通常不计入净资产' : '关闭后不参与净资产统计'}</small></span><input type="checkbox" checked={form.includeInNetWorth} onChange={(event) => setForm({ ...form, includeInNetWorth: event.target.checked })} /></label>
        <FormField label="备注" count={`${form.remark.length}/255`}><textarea maxLength={255} value={form.remark} placeholder="请输入备注信息（选填）" onChange={(event) => setForm({ ...form, remark: event.target.value })} /></FormField>
      </section>
      <BottomAction disabled={saving} onClick={() => void save()}>{saving && <LoaderCircle className="is-spinning" />}{saving ? '保存中…' : '保存'}</BottomAction>
      <AccountIconSheet open={iconOpen} icons={icons} value={form.iconKey} nature={form.accountNature} onClose={() => setIconOpen(false)} onConfirm={(iconKey) => { setForm({ ...form, iconKey }); setIconOpen(false) }} />
    </main>
  )
}

function FormField({ label, required, hint, count, children }: { label: string; required?: boolean; hint?: string; count?: string; children: ReactNode }) { return <label className="account-form__field"><span>{label}{required && <em>*</em>}</span>{children}{hint && <small><AlertCircle size={13} />{hint}</small>}{count && <i>{count}</i>}</label> }
function MoneyField({ value, placeholder, disabled, onChange }: { value: string; placeholder: string; disabled?: boolean; onChange: (value: string) => void }) { return <span className="account-form__money">¥<input disabled={disabled} inputMode="decimal" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value.replace(/[^\d.]/g, ''))} /></span> }
function PageStatus({ loading, text, secondary, retry }: { loading?: boolean; text: string; secondary?: string; retry?: () => void | Promise<void> }) { return <div className="account-status">{loading && <LoaderCircle className="is-spinning" />}<strong>{text}</strong>{secondary && <span>{secondary}</span>}{retry && <button type="button" onClick={() => void retry()}><RotateCcw />重新加载</button>}</div> }
function BottomAction({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) { return <div className="account-bottom"><button type="button" disabled={disabled} onClick={onClick}>{children}</button></div> }
