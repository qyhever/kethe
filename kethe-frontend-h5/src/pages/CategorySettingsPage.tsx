import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Minus,
  Plus,
  RotateCcw,
  TextAlignJustify,
} from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createCategory,
  fetchCategories,
  fetchCategoryIcons,
  orderCategories,
  removeCategory,
  updateCategory,
} from '../api/ledger'
import type {
  CategoryIconResource,
  LedgerCategory,
  UpdateCategoryPayload,
} from '../api/types'
import { CategoryIcon } from '../components/CategoryIcon/CategoryIcon'
import { Dialog } from '../components/Dialog'
import { useToast } from '../components/Toast'
import './CategorySettingsPage.css'

type PageMode = 'list' | 'form' | 'icons'

interface FormState {
  id?: string
  categoryType: 1 | 2
  parentId: string | null
  name: string
  iconId: string
  sortOrder: number
  remark: string
}

const iconGroups = [
  ['all', '常用'],
  ['food', '餐饮'],
  ['transport', '交通'],
  ['shopping', '购物'],
  ['housing', '住房'],
  ['entertainment', '娱乐'],
  ['medical', '医疗'],
  ['education', '教育'],
  ['social', '人情'],
  ['income', '收入'],
  ['finance', '金融'],
  ['other', '其他'],
] as const

const reorder = <T,>(items: T[], from: number, to: number) => {
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function CategorySettingsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [type, setType] = useState<1 | 2>(1)
  const [categories, setCategories] = useState<LedgerCategory[]>([])
  const [icons, setIcons] = useState<CategoryIconResource[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [mode, setMode] = useState<PageMode>('list')
  const [form, setForm] = useState<FormState | null>(null)
  const [iconGroup, setIconGroup] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<LedgerCategory | null>(null)
  const [deleting, setDeleting] = useState(false)
  const dragRef = useRef<{ id: string; parentId: string | null; snapshot: LedgerCategory[] } | null>(null)
  const listRef = useRef<HTMLElement>(null)
  const sortPositionsRef = useRef<Map<string, DOMRect> | null>(null)
  const categoriesRef = useRef(categories)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  categoriesRef.current = categories

  useLayoutEffect(() => {
    const previousPositions = sortPositionsRef.current
    sortPositionsRef.current = null
    if (!previousPositions || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    listRef.current?.querySelectorAll<HTMLElement>('[data-sort-item]').forEach((element) => {
      const key = element.dataset.sortItem
      const previous = key ? previousPositions.get(key) : undefined
      if (!previous) return

      element.getAnimations().forEach((animation) => animation.cancel())
      const current = element.getBoundingClientRect()
      const deltaX = previous.left - current.left
      const deltaY = previous.top - current.top
      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return

      element.animate(
        [
          { transform: `translate3d(${deltaX}px, ${deltaY}px, 0)` },
          { transform: 'translate3d(0, 0, 0)' },
        ],
        { duration: 240, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      )
    })
  }, [categories])

  useEffect(() => () => document.body.classList.remove('category-sorting'), [])

  const load = useCallback(async (categoryType: 1 | 2, quiet = false) => {
    if (!quiet) setLoading(true)
    setError('')
    try {
      const [nextCategories, nextIcons] = await Promise.all([
        fetchCategories(categoryType),
        icons.length ? Promise.resolve(icons) : fetchCategoryIcons(),
      ])
      const enabledCategories = nextCategories.filter((item) => item.isEnabled)
      setCategories(enabledCategories)
      setExpanded((current) => {
        if (current.size > 0) return current
        const firstParent = enabledCategories.find((item) => item.children.some((child) => child.isEnabled))
        return firstParent ? new Set([firstParent.id]) : current
      })
      setIcons(nextIcons)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '加载分类失败')
    } finally {
      setLoading(false)
    }
  }, [icons])

  useEffect(() => {
    void load(type)
    // 图标资源只需首次加载，避免把 icons 作为切换页签的触发条件。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  const selectedIcon = icons.find((item) => item.id === form?.iconId) ?? icons[0]
  const parentOptions = categories.filter(
    (item) => !form?.id || (item.id !== form.id && item.parentId === null),
  )
  const visibleIcons = iconGroup === 'all'
    ? icons
    : icons.filter((item) => item.groupKey === iconGroup)

  const openNew = () => {
    const siblings = categories
    setForm({
      categoryType: type,
      parentId: null,
      name: '',
      iconId: icons[0]?.id ?? '',
      sortOrder: siblings.length ? Math.max(...siblings.map((item) => item.sortOrder)) + 1 : 0,
      remark: '',
    })
    setMode('form')
  }

  const openEdit = (item: LedgerCategory) => {
    setForm({
      id: item.id,
      categoryType: item.categoryType,
      parentId: item.parentId,
      name: item.name,
      iconId: item.iconId ?? '',
      sortOrder: item.sortOrder,
      remark: item.remark ?? '',
    })
    setMode('form')
  }

  const save = async () => {
    if (!form) return
    const name = form.name.trim()
    if (!name) return void toast.warning('请输入分类名称')
    if (!form.iconId) return void toast.warning('请选择分类图标')
    setSaving(true)
    try {
      const payload: UpdateCategoryPayload = {
        parentId: form.categoryType === 1 ? form.parentId : null,
        name,
        iconId: form.iconId,
        sortOrder: form.sortOrder,
        remark: form.remark.trim() || null,
      }
      if (form.id) await updateCategory(form.id, payload)
      else await createCategory({ ...payload, categoryType: form.categoryType })
      toast.success(form.id ? '分类已更新' : '分类已添加')
      await load(type, true)
      setMode('list')
      setForm(null)
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      const result = await removeCategory(pendingDelete.id)
      toast.success(result.action === 'deleted' ? '分类已删除' : '分类已停用')
      setPendingDelete(null)
      await load(type, true)
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : '移除失败')
    } finally {
      setDeleting(false)
    }
  }

  const captureSortPositions = (parentId: string | null) => {
    const parentKey = parentId ?? ''
    const positions = new Map<string, DOMRect>()
    listRef.current?.querySelectorAll<HTMLElement>('[data-sort-item]').forEach((element) => {
      if (element.dataset.sortParent === parentKey && element.dataset.sortItem) {
        positions.set(element.dataset.sortItem, element.getBoundingClientRect())
      }
    })
    sortPositionsRef.current = positions
  }

  const moveDragged = (
    targetId: string,
    parentId: string | null,
    pointerY: number,
    targetElement: HTMLElement,
  ) => {
    const dragging = dragRef.current
    if (!dragging || dragging.parentId !== parentId || dragging.id === targetId) return
    const siblings = parentId === null
      ? categoriesRef.current
      : categoriesRef.current.find((item) => item.id === parentId)?.children ?? []
    const from = siblings.findIndex((item) => item.id === dragging.id)
    const to = siblings.findIndex((item) => item.id === targetId)
    if (from < 0 || to < 0) return

    const targetRect = targetElement.getBoundingClientRect()
    const targetMiddle = targetRect.top + targetRect.height / 2
    if ((from < to && pointerY <= targetMiddle) || (from > to && pointerY >= targetMiddle)) return

    captureSortPositions(parentId)
    setCategories((current) => {
      if (parentId === null) {
        const currentFrom = current.findIndex((item) => item.id === dragging.id)
        const currentTo = current.findIndex((item) => item.id === targetId)
        return currentFrom < 0 || currentTo < 0 ? current : reorder(current, currentFrom, currentTo)
      }
      return current.map((parent) => {
        if (parent.id !== parentId) return parent
        const currentFrom = parent.children.findIndex((item) => item.id === dragging.id)
        const currentTo = parent.children.findIndex((item) => item.id === targetId)
        return currentFrom < 0 || currentTo < 0
          ? parent
          : { ...parent, children: reorder(parent.children, currentFrom, currentTo) }
      })
    })
  }

  const finishDrag = async () => {
    const dragging = dragRef.current
    dragRef.current = null
    setDraggingId(null)
    if (!dragging) return
    const siblings = dragging.parentId === null
      ? categoriesRef.current
      : categoriesRef.current.find((item) => item.id === dragging.parentId)?.children ?? []
    try {
      await orderCategories(siblings.map((item, index) => ({ id: item.id, sortOrder: index })))
    } catch (caught) {
      setCategories(dragging.snapshot)
      toast.error(caught instanceof Error ? `${caught.message}，已恢复原排序` : '排序失败，已恢复')
    }
  }

  const iconFor = (item: LedgerCategory) => (
    <span className="category-settings__icon" style={{ '--icon-color': item.iconColor ?? '#64748B' } as React.CSSProperties}>
      <CategoryIcon name={item.iconKey ?? 'other'} svgContent={item.svgContent} color="currentColor" size={26} />
    </span>
  )

  const row = (item: LedgerCategory, parentId: string | null, child = false) => (
    <div
      className={`category-settings__row${child ? ' category-settings__row--child' : ''}${draggingId === item.id ? ' is-dragging' : ''}`}
      key={item.id}
      data-drag-id={item.id}
      data-sort-item={child ? item.id : undefined}
      data-sort-parent={child ? parentId ?? '' : undefined}
      onPointerEnter={(event) => moveDragged(item.id, parentId, event.clientY, event.currentTarget)}
    >
      <button className="category-settings__row-main" type="button" onClick={() => openEdit(item)}>
        {iconFor(item)}
        <span className="category-settings__row-copy">
          <strong>{item.name}</strong>
          {!child && <small>{item.children.length} 个子分类</small>}
        </span>
      </button>
      <button
        className="category-settings__drag"
        type="button"
        aria-label={`拖动${item.name}排序`}
        onPointerDown={(event) => {
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          dragRef.current = { id: item.id, parentId, snapshot: categories }
          setDraggingId(item.id)
          document.body.classList.add('category-sorting')
        }}
        onPointerMove={(event) => {
          if (!dragRef.current) return
          const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-drag-id]')
          if (target?.dataset.dragId) moveDragged(target.dataset.dragId, parentId, event.clientY, target)
        }}
        onPointerUp={() => {
          document.body.classList.remove('category-sorting')
          void finishDrag()
        }}
        onPointerCancel={() => {
          document.body.classList.remove('category-sorting')
          void finishDrag()
        }}
      >
        <TextAlignJustify size={23} />
      </button>
      {!child && item.children.length > 0 && (
        <button
          className="category-settings__expand"
          type="button"
          aria-label={expanded.has(item.id) ? '收起子分类' : '展开子分类'}
          aria-expanded={expanded.has(item.id)}
          onClick={() => setExpanded((old) => {
            const next = new Set(old)
            if (next.has(item.id)) next.delete(item.id)
            else next.add(item.id)
            return next
          })}
        >
          {expanded.has(item.id) ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
        </button>
      )}
      <button className="category-settings__remove" type="button" aria-label={`移除${item.name}`} onClick={() => setPendingDelete(item)}>
        <Minus size={19} strokeWidth={3} />
      </button>
    </div>
  )

  if (mode === 'icons' && form) {
    return (
      <main className="category-settings category-settings--subpage">
        <header className="category-settings__header">
          <button type="button" aria-label="返回编辑分类" onClick={() => setMode('form')}><ChevronLeft /></button>
          <h1>选择图标</h1><span />
        </header>
        <nav className="category-settings__icon-tabs" aria-label="图标分组">
          {iconGroups.map(([key, label]) => (
            <button className={iconGroup === key ? 'is-active' : ''} type="button" key={key} onClick={() => setIconGroup(key)}>{label}</button>
          ))}
        </nav>
        <div className="category-settings__icon-grid">
          {visibleIcons.map((item) => (
            <button
              className={form.iconId === item.id ? 'is-selected' : ''}
              type="button"
              key={item.id}
              aria-label={item.iconName}
              onClick={() => { setForm({ ...form, iconId: item.id }); setMode('form') }}
            >
              <span style={{ '--icon-color': item.color } as React.CSSProperties}>
                <CategoryIcon name={item.iconKey} svgContent={item.svgContent} color="currentColor" size={28} />
              </span>
            </button>
          ))}
        </div>
      </main>
    )
  }

  if (mode === 'form' && form) {
    const editingParentWithChildren = Boolean(form.id && categories.find((item) => item.id === form.id)?.children.length)
    return (
      <main className="category-settings category-settings--subpage">
        <header className="category-settings__header">
          <button type="button" aria-label="返回分类设置" onClick={() => { setMode('list'); setForm(null) }}><ChevronLeft /></button>
          <h1>{form.id ? '编辑分类' : '新增分类'}</h1><span />
        </header>
        {!form.id && <TypeTabs value={form.categoryType} onChange={(next) => setForm({ ...form, categoryType: next, parentId: null })} />}
        <section className="category-settings__form">
          {form.categoryType === 1 && (
            <label className="category-settings__field category-settings__field--select">
              <span>上级分类</span>
              <select
                value={form.parentId ?? ''}
                disabled={editingParentWithChildren}
                onChange={(event) => {
                  const parentId = event.target.value || null
                  const siblings = parentId
                    ? categories.find((item) => item.id === parentId)?.children ?? []
                    : categories
                  setForm({
                    ...form,
                    parentId,
                    sortOrder: siblings.length
                      ? Math.max(...siblings.map((item) => item.sortOrder)) + 1
                      : 0,
                  })
                }}
              >
                <option value="">无（一级分类）</option>
                {parentOptions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
              <ChevronRight size={20} />
              {editingParentWithChildren && <small>含子分类的一级分类不可调整上级</small>}
            </label>
          )}
          <label className="category-settings__field">
            <span>分类名称</span>
            <div className="category-settings__input-line">
              <input value={form.name} maxLength={12} placeholder="请输入分类名称" onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <small>{form.name.length}/12</small>
            </div>
          </label>
          <button className="category-settings__field category-settings__icon-field" type="button" onClick={() => setMode('icons')}>
            <span>图标</span>
            {selectedIcon && <span className="category-settings__icon" style={{ '--icon-color': selectedIcon.color } as React.CSSProperties}><CategoryIcon name={selectedIcon.iconKey} svgContent={selectedIcon.svgContent} color="currentColor" size={28} /></span>}
            <ChevronRight size={20} />
          </button>
          <label className="category-settings__field">
            <span>排序</span>
            <input className="category-settings__sort-input" type="number" min="0" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Math.max(0, Number(event.target.value) || 0) })} />
            <small>数字越小，排序越靠前</small>
          </label>
          <label className="category-settings__field category-settings__field--remark">
            <span>备注</span>
            <textarea value={form.remark} maxLength={50} placeholder="请输入备注（选填）" onChange={(event) => setForm({ ...form, remark: event.target.value })} />
            <small>{form.remark.length}/50</small>
          </label>
        </section>
        <div className="category-settings__form-footer">
          <button type="button" disabled={saving} onClick={() => void save()}>{saving && <LoaderCircle className="is-spinning" size={19} />}{saving ? '保存中…' : '保存'}</button>
        </div>
      </main>
    )
  }

  return (
    <main className="category-settings">
      <header className="category-settings__header">
        <button type="button" aria-label="返回我的" onClick={() => navigate('/profile')}><ChevronLeft /></button>
        <h1>分类设置</h1><span />
      </header>
      <TypeTabs value={type} onChange={setType} />
      <p className="category-settings__intro">管理{type === 1 ? '支出' : '收入'}分类，支持新增、编辑、删除和排序</p>
      <section className="category-settings__list" aria-live="polite" ref={listRef}>
        {loading ? <div className="category-settings__status"><LoaderCircle className="is-spinning" />加载中…</div>
          : error ? <div className="category-settings__status"><p>{error}</p><button type="button" onClick={() => void load(type)}><RotateCcw size={17} />重新加载</button></div>
            : categories.length === 0 ? <div className="category-settings__status"><p>还没有{type === 1 ? '支出' : '收入'}分类</p><span>点击下方按钮创建第一个分类</span></div>
              : categories.map((item) => (
                <div
                  className={`category-settings__group${draggingId === item.id ? ' is-dragging' : ''}`}
                  key={item.id}
                  data-sort-item={item.id}
                  data-sort-parent=""
                >
                  {row(item, null)}
                  {expanded.has(item.id) && item.children.length > 0 && <div className="category-settings__children" data-children-for={item.id}>{item.children.filter((child) => child.isEnabled).map((child) => row(child, item.id, true))}</div>}
                </div>
              ))}
      </section>
      <div className="category-settings__footer"><button type="button" disabled={loading || Boolean(error)} onClick={openNew}><Plus size={24} />新增分类</button></div>
      <Dialog
        open={Boolean(pendingDelete)}
        title="移除分类"
        description={`确定移除“${pendingDelete?.name ?? ''}”吗？系统分类、已使用分类或包含子分类的分类将停用，历史流水不会受影响。`}
        confirmText="移除"
        danger
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </main>
  )
}

function TypeTabs({ value, onChange }: { value: 1 | 2; onChange: (value: 1 | 2) => void }) {
  return <div className="category-settings__type-tabs" role="tablist" aria-label="分类类型">
    <button role="tab" aria-selected={value === 1} className={value === 1 ? 'is-active' : ''} type="button" onClick={() => onChange(1)}>支出</button>
    <button role="tab" aria-selected={value === 2} className={value === 2 ? 'is-active' : ''} type="button" onClick={() => onChange(2)}>收入</button>
  </div>
}
