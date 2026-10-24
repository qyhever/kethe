import { Loading } from '../components/Loading'
import { SettingsHeader } from '../components/SettingsHeader'
import { ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createMember, fetchMember, fetchMemberOptions, fetchMembers, removeMember, updateMember, type LedgerMember } from '../api/members'
import { Money } from '../components/Account/AccountUI'
import { Dialog } from '../components/Dialog'
import { MemberIcon } from '../components/Member/MemberIcon'
import { memberIconLabels } from '../components/Member/member-icons'
import { MemberSheet } from '../components/Member/MemberSheet'
import { SwipeCell } from '../components/SwipeCell'
import { useToast } from '../components/Toast'
import './AccountSettingsPage.css'
import './MemberSettingsPage.css'

const message = (reason: unknown) => reason instanceof Error ? reason.message : '加载失败，请重试'

export function MemberSettingsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [members, setMembers] = useState<LedgerMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [pending, setPending] = useState<LedgerMember | null>(null)
  const [deleting, setDeleting] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try { setMembers(await fetchMembers()) } catch (reason) { setError(message(reason)) } finally { setLoading(false) }
  }, [])
  useEffect(() => { void load() }, [load])
  const confirmDelete = async () => {
    if (!pending || deleting) return
    setDeleting(true)
    try {
      await removeMember(pending.id)
      setPending(null)
      toast.success('成员已删除')
      await load()
    } catch (reason) { toast.error(message(reason)) } finally { setDeleting(false) }
  }
  return <main className="settings-layout account-page member-page">
    <SettingsHeader title="成员设置" onBack={() => navigate('/profile')} action={<button type="button" aria-label="新增成员" onClick={() => navigate('/profile/members/new')}><Plus /></button>} />
    <p className="member-page__hint">金额为全部未删除流水的累计支出</p>
    {loading ? <Loading text="正在加载成员…" /> : error ? <div className="member-page__status" role="alert">{error}<button type="button" onClick={() => void load()}>重试</button></div> : <section className="member-list">
      {members.map(member => <SwipeCell key={member.id} actionWidth={144} open={openId === member.id} onOpenChange={open => setOpenId(open ? member.id : null)} actions={<>
        <button type="button" onClick={() => navigate('/profile/members/' + member.id + '/edit')}><Pencil size={17} />编辑</button>
        <button type="button" onClick={() => { setOpenId(null); setPending(member) }}><Trash2 size={17} />删除</button>
      </>}><button type="button" className="member-row" onClick={() => navigate('/flow?memberId=' + member.id + '&type=expense&source=members')}>
        <span className="member-icon"><MemberIcon iconKey={member.iconKey} /></span><strong>{member.name}</strong><span className="member-row__amount"><Money cents={member.expenseAmount ?? '0'} /></span><ChevronRight size={18} />
      </button></SwipeCell>)}
      {members.length === 0 && <p className="member-page__status">暂无成员，添加一个吧</p>}
    </section>}
    <Dialog open={pending !== null} title="删除成员" description={'确定删除“' + (pending?.name ?? '') + '”吗？历史流水将保留成员关联，新增记账将无法选择该成员。'} danger confirmText="删除" loading={deleting} onConfirm={confirmDelete} onCancel={() => setPending(null)} />
  </main>
}

export function MemberEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [name, setName] = useState('')
  const [iconKey, setIconKey] = useState('user')
  const [icons, setIcons] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [picker, setPicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    Promise.all([fetchMemberOptions(), id ? fetchMember(id) : Promise.resolve(null)]).then(([options, member]) => {
      if (!active) return
      setIcons(options)
      if (member) { setName(member.name); setIconKey(member.iconKey) }
    }).catch((reason: unknown) => { if (active) setError(message(reason)) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, retry])
  const save = async () => {
    if (savingRef.current || loading || error) return
    const trimmed = name.trim()
    if (!trimmed || [...trimmed].length > 12) return toast.error('成员名称须为 1 至 12 个字符')
    savingRef.current = true
    setSaving(true)
    try {
      const payload = { name: trimmed, iconKey }
      if (id) await updateMember(id, payload)
      else await createMember(payload)
      toast.success('保存成功')
      navigate('/profile/members', { replace: true })
    } catch (reason) { toast.error(message(reason)) } finally { savingRef.current = false; setSaving(false) }
  }
  return <main className="settings-layout account-page member-page">
    <SettingsHeader title={id ? '编辑成员' : '新增成员'} onBack={() => navigate('/profile/members')} />
    {loading ? <Loading /> : error ? <div className="member-page__status" role="alert">{error}<button type="button" onClick={() => setRetry(value => value + 1)}>重试</button></div> : <form className="member-form" onSubmit={event => { event.preventDefault(); void save() }}>
      <label className="member-row"><strong>成员名称</strong><input aria-label="成员名称" placeholder="请输入成员名称" value={name} disabled={saving} onChange={event => setName(event.target.value)} /></label>
      <button className="member-row" type="button" disabled={saving} onClick={() => setPicker(true)}><strong>成员图标</strong><span className="member-icon"><MemberIcon iconKey={iconKey} /></span><ChevronRight size={18} /></button>
      <button className="member-save" type="submit" disabled={saving}>{saving ? '保存中…' : '保存'}</button>
    </form>}
    <MemberSheet title="选择成员图标" open={picker} accounts={icons.map(key => ({ id: key, name: memberIconLabels[key] ?? key, iconKey: key }))} selectedId={iconKey} onClose={() => setPicker(false)} onSelect={item => { if (item.id) setIconKey(item.id); setPicker(false) }} />
  </main>
}
