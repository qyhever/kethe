import type { BusinessIconOption } from '../api/icons'
import { Loading } from '../components/Loading'
import { SettingsHeader } from '../components/SettingsHeader'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Pencil, Archive, Trash2, ChevronRight } from 'lucide-react'
import {
  createExpenseProject,
  fetchExpenseProject,
  fetchExpenseProjectOptions,
  fetchExpenseProjects,
  fetchProjectCategories,
  removeExpenseProject,
  updateExpenseProject,
  type ExpenseProject,
  type ProjectCategories,
} from '../api/expense-projects'
import { Money } from '../components/Account/AccountUI'
import { ExpenseProjectIcon } from '../components/ExpenseProject/ExpenseProjectIcon'
import { ExpenseProjectSheet } from '../components/ExpenseProject/ExpenseProjectSheet'
import { DatePicker } from '../components/DatePicker'
import { Dialog } from '../components/Dialog'
import { SwipeCell } from '../components/SwipeCell'
import { useToast } from '../components/Toast'
import './AccountSettingsPage.css'
import './MemberSettingsPage.css'
import './ExpenseProjectPages.css'
const root = '/profile/expense-projects'
const message = (reason: unknown) =>
  reason instanceof Error ? reason.message : '加载失败，请重试'
const dates = (item: ExpenseProject) =>
  item.startDate || item.endDate
    ? (item.startDate ?? '未指定') + ' ～ ' + (item.endDate ?? '未指定')
    : '未设置日期'
export function ExpenseProjectListPage() {
  const navigate = useNavigate(),
    toast = useToast()
  const [status, setStatus] = useState('active'),
    [items, setItems] = useState<ExpenseProject[]>([]),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null),
    [pending, setPending] = useState<ExpenseProject | null>(null),
    [busy, setBusy] = useState(false)
  const loadGeneration = useRef(0)
  const load = useCallback(async () => {
    const generation = ++loadGeneration.current
    setLoading(true)
    setError('')
    try {
      const items = await fetchExpenseProjects(status)
      if (generation === loadGeneration.current) setItems(items)
    } catch (reason) {
      if (generation === loadGeneration.current) setError(message(reason))
    } finally {
      if (generation === loadGeneration.current) setLoading(false)
    }
  }, [status])
  useEffect(() => {
    void load()
    return () => {
      loadGeneration.current += 1
    }
  }, [load])
  const mutate = async () => {
    if (!pending || busy) return
    setBusy(true)
    try {
      if (pending.hasTransactions)
        await updateExpenseProject(pending.id, {
          isArchived: !pending.isArchived,
        })
      else await removeExpenseProject(pending.id)
      setPending(null)
      await load()
    } catch (reason) {
      toast.error(message(reason))
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="settings-layout account-page member-page project-page">
      <SettingsHeader
        title="项目设置"
        onBack={() => navigate('/profile')}
        action={
          <button
            type="button"
            aria-label="新增项目"
            onClick={() => navigate(root + '/new')}
          >
            <Plus />
          </button>
        }
      />
      <div className="project-tabs">
        {['active', 'archived'].map((value, i) => (
          <button
            type="button"
            key={value}
            aria-pressed={status === value}
            onClick={() => setStatus(value)}
          >
            {['未归档', '已归档'][i]}
          </button>
        ))}
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <p role="alert" className="member-page__status">
          {error}
          <button onClick={() => void load()}>重试</button>
        </p>
      ) : (
        <section className="member-list">
          {items.map((item) => (
            <SwipeCell
              key={item.id}
              actionWidth={144}
              open={openId === item.id}
              onOpenChange={(open) => setOpenId(open ? item.id : null)}
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => navigate(root + '/' + item.id + '/edit')}
                  >
                    <Pencil size={17} />
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenId(null)
                      setPending(item)
                    }}
                  >
                    {item.hasTransactions ? (
                      <Archive size={17} />
                    ) : (
                      <Trash2 size={17} />
                    )}
                    {item.hasTransactions
                      ? item.isArchived
                        ? '恢复'
                        : '归档'
                      : '删除'}
                  </button>
                </>
              }
            >
              <button
                type="button"
                className="member-row"
                onClick={() => navigate(root + '/' + item.id)}
              >
                <span className="member-icon">
                  <ExpenseProjectIcon iconKey={item.iconKey} />
                </span>
                <span className="project-name">
                  <strong>{item.name}</strong>
                  <small>{dates(item)}</small>
                </span>
                <span className="project-total">
                  <Money cents={item.expenseAmount} />
                  <small>{item.transactionCount} 笔</small>
                </span>
                <ChevronRight size={18} />
              </button>
            </SwipeCell>
          ))}
          {!items.length && (
            <p className="member-page__status">
              暂无{status === 'archived' ? '已归档' : ''}项目
            </p>
          )}
        </section>
      )}
      <Dialog
        open={!!pending}
        title={
          pending?.hasTransactions
            ? pending.isArchived
              ? '恢复项目'
              : '归档项目'
            : '删除项目'
        }
        description={
          pending?.hasTransactions
            ? pending.isArchived
              ? '恢复后可在新流水中选择此项目。'
              : '归档后保留历史关联，新流水不可选择此项目。'
            : '确定删除此项目吗？'
        }
        danger={!pending?.hasTransactions}
        loading={busy}
        onConfirm={mutate}
        onCancel={() => setPending(null)}
      />
    </main>
  )
}
export function ExpenseProjectEditPage() {
  const { id } = useParams(),
    navigate = useNavigate(),
    toast = useToast()
  const [name, setName] = useState(''),
    [iconKey, setIconKey] = useState(''),
    [startDate, setStartDate] = useState(''),
    [endDate, setEndDate] = useState(''),
    [remark, setRemark] = useState('')
  const [icons, setIcons] = useState<BusinessIconOption[]>([]),
    [picker, setPicker] = useState(false),
    [datePicker, setDatePicker] = useState<'start' | 'end' | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0),
    [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    Promise.all([
      fetchExpenseProjectOptions(),
      id ? fetchExpenseProject(id) : Promise.resolve(null),
    ])
      .then(([options, item]) => {
        if (!active) return
        setIcons(options)
        if (!id) setIconKey((options.find(option => option.isDefault) ?? options[0])?.iconKey ?? '')
        if (item) {
          setName(item.name)
          setIconKey(item.iconKey)
          setStartDate(item.startDate ?? '')
          setEndDate(item.endDate ?? '')
          setRemark(item.remark ?? '')
        }
      })
      .catch((reason) => {
        if (active) setError(message(reason))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, retry])
  const back = () => navigate(id ? root + '/' + id : root)
  const save = async () => {
    if (savingRef.current) return
    if (!name.trim() || [...name.trim()].length > 30)
      return toast.error('项目名称须为 1 至 30 个字符')
    if (startDate && endDate && endDate < startDate)
      return toast.error('结束日期不得早于开始日期')
    savingRef.current = true
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        iconKey,
        startDate: startDate || null,
        endDate: endDate || null,
        remark: remark || null,
      }
      const item = id
        ? await updateExpenseProject(id, payload)
        : await createExpenseProject(payload)
      toast.success('保存成功')
      navigate(root + '/' + item.id, { replace: true })
    } catch (reason) {
      toast.error(message(reason))
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }
  return (
    <main className="settings-layout account-page member-page project-page">
      <SettingsHeader title={id ? '编辑项目' : '新增项目'} onBack={back} />
      {loading ? (
        <Loading />
      ) : error ? (
        <p role="alert">
          {error}
          <button onClick={() => setRetry((v) => v + 1)}>重试</button>
        </p>
      ) : (
        <form
          className="member-form"
          onSubmit={(e) => {
            e.preventDefault()
            void save()
          }}
        >
          <label className="member-row">
            <strong>项目名称</strong>
            <input
              aria-label="项目名称"
              value={name}
              maxLength={30}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <button
            type="button"
            className="member-row"
            onClick={() => setPicker(true)}
          >
            <strong>场景图标</strong>
            <ExpenseProjectIcon iconKey={iconKey} />
          </button>
          {(['start', 'end'] as const).map((key) => (
            <div className="member-row" key={key}>
              <button type="button" onClick={() => setDatePicker(key)}>
                {key === 'start' ? '开始日期' : '结束日期'}：
                {(key === 'start' ? startDate : endDate) || '选填'}
              </button>
              <button
                type="button"
                onClick={() =>
                  key === 'start' ? setStartDate('') : setEndDate('')
                }
              >
                清空
              </button>
            </div>
          ))}
          <label className="member-row">
            <strong>备注</strong>
            <textarea
              aria-label="备注"
              maxLength={500}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
          </label>
          <button type="submit" className="member-save" disabled={saving}>
            {saving ? '保存中…' : '保存'}
          </button>
        </form>
      )}
      <ExpenseProjectSheet
        title="选择场景图标"
        open={picker}
        accounts={icons.map((item) => ({
          id: item.iconKey,
          name: item.iconName,
          iconKey: item.iconKey,
        }))}
        selectedId={iconKey}
        onClose={() => setPicker(false)}
        onSelect={(item) => {
          setIconKey(item.id!)
          setPicker(false)
        }}
      />
      {datePicker && (
        <DatePicker
          label={datePicker === 'start' ? '开始日期' : '结束日期'}
          value={
            (datePicker === 'start' ? startDate : endDate) ||
            new Date().toLocaleDateString('sv-SE')
          }
          onChange={(value) =>
            datePicker === 'start' ? setStartDate(value) : setEndDate(value)
          }
          onClose={() => setDatePicker(null)}
        />
      )}
    </main>
  )
}
export function ExpenseProjectDetailPage() {
  const { id = '' } = useParams(),
    navigate = useNavigate(),
    toast = useToast()
  const [item, setItem] = useState<ExpenseProject | null>(null),
    [report, setReport] = useState<ProjectCategories | null>(null),
    [parent, setParent] = useState<{ id: string; name: string } | null>(null),
    [error, setError] = useState(''),
    [categoryError, setCategoryError] = useState(''),
    [retry, setRetry] = useState(0),
    [pending, setPending] = useState(false),
    [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    setError('')
    fetchExpenseProject(id)
      .then((value) => {
        if (active) setItem(value)
      })
      .catch((reason) => {
        if (active) setError(message(reason))
      })
    return () => {
      active = false
    }
  }, [id, retry])
  useEffect(() => {
    let active = true
    setReport(null)
    setCategoryError('')
    fetchProjectCategories(id, parent?.id)
      .then((value) => {
        if (active) setReport(value)
      })
      .catch((reason) => {
        if (active) setCategoryError(message(reason))
      })
    return () => {
      active = false
    }
  }, [id, parent, retry])
  const archive = async () => {
    if (!item || busy) return
    setBusy(true)
    try {
      setItem(await updateExpenseProject(id, { isArchived: !item.isArchived }))
      setPending(false)
    } catch (reason) {
      toast.error(message(reason))
    } finally {
      setBusy(false)
    }
  }
  const colors = [
    'var(--color-brand)',
    'var(--color-success)',
    'var(--color-warning)',
    'var(--color-danger)',
    'var(--color-text-secondary)',
  ]
  let angle = 0
  const gradient = report?.list
    .map((row, i) => {
      const start = angle
      angle += row.percentage
      return colors[i % colors.length] + ' ' + start + '% ' + angle + '%'
    })
    .join(',')
  return (
    <main className="settings-layout account-page member-page project-page">
      <SettingsHeader
        title="项目详情"
        onBack={() => navigate(root)}
        action={
          item && (
            <button
              aria-label="编辑项目"
              onClick={() => navigate(root + '/' + id + '/edit')}
            >
              <Pencil />
            </button>
          )
        }
      />
      {error ? (
        <p role="alert">
          {error}
          <button onClick={() => setRetry((v) => v + 1)}>重试</button>
        </p>
      ) : !item ? (
        <Loading />
      ) : (
        <>
          <section className="project-card">
            <ExpenseProjectIcon iconKey={item.iconKey} size={36} />
            <h1>{item.name}</h1>
            <p>
              {dates(item)} · {item.isArchived ? '已归档' : '未归档'}
            </p>
            {item.remark && <p className="project-remark">{item.remark}</p>}
            <h2>
              <Money cents={item.expenseAmount} />
            </h2>
            <p>累计支出 · {item.transactionCount} 笔</p>
            <div className="project-tabs">
              <button onClick={() => setPending(true)}>
                {item.isArchived ? '恢复项目' : '归档项目'}
              </button>
              <button
                onClick={() =>
                  navigate(
                    '/flow?expenseProjectId=' +
                      id +
                      '&type=expense&source=expense-project',
                  )
                }
              >
                查看流水
              </button>
            </div>
          </section>
          <section className="project-card">
            <h2>分类构成</h2>
            {parent && (
              <button onClick={() => setParent(null)}>
                返回全部分类 / {parent.name}
              </button>
            )}
            {categoryError ? (
              <p role="alert">
                {categoryError}
                <button onClick={() => setRetry((v) => v + 1)}>重试</button>
              </p>
            ) : !report ? (
              <Loading variant="compact" text="正在加载分类构成…" />
            ) : (
              <>
                {report.list.length > 0 && (
                  <div
                    className="project-donut"
                    role="img"
                    aria-label="分类费用占比"
                    style={{
                      background:
                        BigInt(report.expenseAmount) > 0n
                          ? 'conic-gradient(' + gradient + ')'
                          : 'var(--color-fill)',
                    }}
                  >
                    <span>
                      <Money cents={report.expenseAmount} />
                    </span>
                  </div>
                )}
                {report.list.map((row, i) => (
                  <button
                    className="member-row"
                    key={row.categoryId ?? 'direct'}
                    disabled={!row.canDrillDown}
                    onClick={() =>
                      row.categoryId &&
                      setParent({ id: row.categoryId, name: row.name })
                    }
                  >
                    <i
                      className="project-dot"
                      style={{ background: colors[i % colors.length] }}
                    />
                    <strong>{row.name}</strong>
                    <Money cents={row.amount} />
                    <span>{row.percentage}%</span>
                    {row.canDrillDown && <ChevronRight size={18} />}
                  </button>
                ))}
                {!report.list.length && <p>暂无支出流水</p>}
              </>
            )}
          </section>
        </>
      )}
      <Dialog
        open={pending}
        title={item?.isArchived ? '恢复项目' : '归档项目'}
        description={
          item?.isArchived
            ? '恢复后可在新流水中选择。'
            : '归档后保留历史关联，新流水不可选择。'
        }
        loading={busy}
        onConfirm={archive}
        onCancel={() => setPending(false)}
      />
    </main>
  )
}
