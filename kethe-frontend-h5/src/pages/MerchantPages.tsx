import type { BusinessIconOption } from '../api/icons'
import { Loading } from '../components/Loading'
import { SettingsHeader } from '../components/SettingsHeader'
import { ChevronRight, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createMerchant,
  fetchMerchant,
  fetchMerchantOptions,
  fetchMerchants,
  updateMerchant,
  type Merchant,
} from '../api/merchants'
import { MerchantIcon } from '../components/Merchant/MerchantIcon'
import { MerchantSheet } from '../components/Merchant/MerchantSheet'
import { useToast } from '../components/Toast'
import './AccountSettingsPage.css'
import './MemberSettingsPage.css'
import './MerchantPages.css'
const message = (reason: unknown) =>
  reason instanceof Error ? reason.message : '加载失败，请重试'
export function MerchantListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Merchant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    fetchMerchants()
      .then((items) => {
        if (active) setItems(items)
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
  }, [retry])
  return (
    <main className="settings-layout account-page member-page merchant-page">
      <SettingsHeader
        title="商家设置"
        onBack={() => navigate('/profile')}
        action={
          <button
            type="button"
            aria-label="新增商家"
            onClick={() => navigate('/profile/merchants/new')}
          >
            <Plus />
          </button>
        }
      />
      {loading ? (
        <Loading text="正在加载商家…" />
      ) : error ? (
        <div className="member-page__status" role="alert">
          {error}
          <button type="button" onClick={() => setRetry((v) => v + 1)}>
            重试
          </button>
        </div>
      ) : (
        <section className="member-list">
          {items.map((item) => (
            <button
              type="button"
              className="member-row"
              key={item.id}
              onClick={() =>
                navigate('/profile/merchants/' + item.id + '/edit')
              }
            >
              <span className="member-icon">
                <MerchantIcon iconKey={item.iconKey} />
              </span>
              <strong>{item.name}</strong>
              <ChevronRight size={18} />
            </button>
          ))}
          {!items.length && (
            <p className="member-page__status">暂无商家，添加一个吧</p>
          )}
        </section>
      )}
    </main>
  )
}

export function MerchantEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [name, setName] = useState('')
  const [iconKey, setIconKey] = useState('')
  const [icons, setIcons] = useState<BusinessIconOption[]>([])
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
    Promise.all([
      fetchMerchantOptions(),
      id ? fetchMerchant(id) : Promise.resolve(null),
    ])
      .then(([options, merchant]) => {
        if (!active) return
        setIcons(options)
        if (!id) setIconKey((options.find(option => option.isDefault) ?? options[0])?.iconKey ?? '')
        if (merchant) {
          setName(merchant.name)
          setIconKey(merchant.iconKey)
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(message(reason))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, retry])
  const save = async () => {
    if (savingRef.current || loading || error) return
    const trimmed = name.trim()
    if (!trimmed || [...trimmed].length > 30)
      return toast.error('商家名称须为 1 至 30 个字符')
    savingRef.current = true
    setSaving(true)
    try {
      const payload = { name: trimmed, iconKey }
      if (id) await updateMerchant(id, payload)
      else await createMerchant(payload)
      toast.success('保存成功')
      navigate('/profile/merchants', { replace: true })
    } catch (reason) {
      toast.error(message(reason))
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }
  return (
    <main className="settings-layout account-page member-page merchant-page">
      <SettingsHeader
        title={id ? '编辑商家' : '新增商家'}
        onBack={() => navigate('/profile/merchants')}
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <div className="member-page__status" role="alert">
          {error}
          <button type="button" onClick={() => setRetry((value) => value + 1)}>
            重试
          </button>
        </div>
      ) : (
        <form
          className="member-form"
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
        >
          <label className="member-row">
            <strong>商家名称</strong>
            <input
              aria-label="商家名称"
              placeholder="请输入商家名称"
              value={name}
              disabled={saving}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <button
            className="member-row"
            type="button"
            disabled={saving}
            onClick={() => setPicker(true)}
          >
            <strong>商家图标</strong>
            <span className="member-icon">
              <MerchantIcon iconKey={iconKey} />
            </span>
            <ChevronRight size={18} />
          </button>
          <button className="member-save" type="submit" disabled={saving}>
            {saving ? '保存中…' : '保存'}
          </button>
        </form>
      )}
      <MerchantSheet
        title="选择商家图标"
        open={picker}
        accounts={icons.map((item) => ({
          id: item.iconKey,
          name: item.iconName,
          iconKey: item.iconKey,
        }))}
        selectedId={iconKey}
        onClose={() => setPicker(false)}
        onSelect={(item) => {
          if (item.id) setIconKey(item.id)
          setPicker(false)
        }}
      />
    </main>
  )
}
