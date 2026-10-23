import { Loading } from '../components/Loading'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import fallbackAvatar from '../assets/avatar.svg'
import { SettingsHeader } from '../components/SettingsHeader'
import { useToast } from '../components/Toast'
import { useAuthStore } from '../stores/auth'
import './UserProfilePages.css'

function Avatar({ large = false }: { large?: boolean }) {
  const source = useAuthStore(state => state.user?.avatar)
  const [failedSource, setFailedSource] = useState<string | null>(null)
  useEffect(() => { setFailedSource(null) }, [source])
  return <img className={large ? 'user-profile-avatar user-profile-avatar--large' : 'user-profile-avatar'} src={source && source !== failedSource ? source : fallbackAvatar} alt="头像" onError={() => setFailedSource(source ?? null)} />
}

function ProfileFrame({ title, list = false, children }: { title: string; list?: boolean; children: ReactNode }) {
  const refresh = useAuthStore(state => state.refreshProfile)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    void refresh().then(() => { if (active) setStatus('ready') }).catch(() => { if (active) setStatus('error') })
    return () => { active = false }
  }, [refresh, attempt])
  return <main className="user-profile-page">
    <SettingsHeader title={title} backTo={list ? '/profile' : '/profile/user'} />
    {status === 'loading' ? <Loading /> : status === 'error' ? <div role="alert"><p>资料加载失败，请重试</p><button className="user-profile-submit" onClick={() => { setStatus('loading'); setAttempt(value => value + 1) }}>重试</button></div> : children}
  </main>
}

export function UserProfilePage() {
  const user = useAuthStore(state => state.user)
  return <ProfileFrame title="个人资料" list>
    <div className="user-profile-list">
      {(['avatar', 'nickname', 'username'] as const).map(field => <Link key={field} to={'/profile/user/' + field}>
        <span>{field === 'avatar' ? '头像' : field === 'nickname' ? '昵称' : '用户名'}</span>
        <span className="user-profile-value">{field === 'avatar' ? <Avatar /> : user?.[field]}</span>
        <ChevronRight size={20} aria-hidden="true" />
      </Link>)}
    </div>
  </ProfileFrame>
}

function TextForm({ field }: { field: 'nickname' | 'username' }) {
  const user = useAuthStore(state => state.user)
  const save = useAuthStore(state => state.saveProfile)
  const [value, setValue] = useState(user?.[field] ?? '')
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const navigate = useNavigate()
  const toast = useToast()
  const trimmed = value.trim()
  const count = [...trimmed].length
  const label = field === 'nickname' ? '昵称' : '用户名'
  const valid = count >= 1 && count <= 50 && trimmed !== user?.[field] && !user?.isSystemDefault
  const submit = async () => {
    if (pending.current || !valid) return
    pending.current = true
    setBusy(true)
    try {
      await save({ [field]: trimmed })
      toast.success(label + '已更新')
      navigate('/profile/user', { replace: true })
    } catch (error) { toast.error(error instanceof Error ? error.message : '保存失败，请重试') }
    finally { pending.current = false; setBusy(false) }
  }
  return <form className="user-profile-form" aria-busy={busy} onSubmit={event => { event.preventDefault(); void submit() }}>
    <label htmlFor="profile-text">{label}</label>
    <input id="profile-text" value={value} onChange={event => setValue(event.target.value)} disabled={busy || user?.isSystemDefault} autoComplete={field === 'username' ? 'username' : 'nickname'} aria-describedby="profile-hint" aria-invalid={count > 50 || (value.length > 0 && count === 0)} />
    <p id="profile-hint">{user?.isSystemDefault ? '系统默认用户不允许修改' : '请输入 1–50 个字符，首尾空白会自动去除'}（{count}/50）</p>
    <button className="user-profile-submit" type="submit" disabled={!valid || busy}>{busy ? '保存中…' : '提交'}</button>
  </form>
}

export function UserProfileTextPage({ field }: { field: 'nickname' | 'username' }) {
  return <ProfileFrame title={field === 'nickname' ? '设置昵称' : '设置用户名'}><TextForm key={field} field={field} /></ProfileFrame>
}

function AvatarForm() {
  const user = useAuthStore(state => state.user)
  const save = useAuthStore(state => state.saveAvatar)
  const input = useRef<HTMLInputElement>(null)
  const pending = useRef(false)
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const upload = useCallback(async (file: File) => {
    if (pending.current || user?.isSystemDefault) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error('请选择 JPG、PNG 或 WebP 图片'); return }
    if (!file.size || file.size > 5 * 1024 * 1024) { toast.error('请选择非空且不超过 5 MiB 的图片'); return }
    pending.current = true
    setBusy(true)
    try { await save(file); toast.success('头像已更新') }
    catch (error) { toast.error(error instanceof Error ? error.message : '上传失败，请重试') }
    finally { pending.current = false; setBusy(false) }
  }, [save, toast, user?.isSystemDefault])
  return <div className="user-profile-avatar-form" aria-busy={busy}>
    <Avatar large />
    <p>{user?.isSystemDefault ? '系统默认用户不允许修改' : '支持 JPG、PNG、WebP，最大 5 MiB'}</p>
    <input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp" disabled={busy || user?.isSystemDefault} onChange={event => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (file) void upload(file)
    }} />
    <button type="button" className="user-profile-submit" disabled={busy || user?.isSystemDefault} onClick={() => input.current?.click()}>{busy ? '上传中…' : '更换头像'}</button>
    {busy && <Loading variant="compact" text="正在保存头像，请稍候…" />}
  </div>
}

export function UserProfileAvatarPage() {
  return <ProfileFrame title="设置头像"><AvatarForm /></ProfileFrame>
}
