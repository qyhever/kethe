import { Check, WalletCards } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import './AccountSheet.css'

export interface AccountSheetOption {
  id?: string
  name: string
  disabled?: boolean
  hint?: string
}

interface AccountSheetProps {
  open: boolean
  accounts: AccountSheetOption[]
  selectedId?: string
  loading?: boolean
  onSelect: (account: AccountSheetOption) => void
  onClose: () => void
}

const EXIT_DURATION = 240

export function AccountSheet({
  open,
  accounts,
  selectedId,
  loading = false,
  onSelect,
  onClose,
}: AccountSheetProps) {
  const titleId = useId()
  const [rendered, setRendered] = useState(open)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setRendered(true)
      return
    }
    if (!rendered) return

    setVisible(false)
    const timer = window.setTimeout(() => setRendered(false), EXIT_DURATION)
    return () => window.clearTimeout(timer)
  }, [open, rendered])

  useEffect(() => {
    if (!open || !rendered) return

    // 等待隐藏状态完成绘制后再切换样式，防止浏览器合并两次渲染而跳过入场动画。
    let visibleFrame = 0
    const mountedFrame = window.requestAnimationFrame(() => {
      visibleFrame = window.requestAnimationFrame(() => setVisible(true))
    })
    return () => {
      window.cancelAnimationFrame(mountedFrame)
      window.cancelAnimationFrame(visibleFrame)
    }
  }, [open, rendered])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!rendered) return null

  return (
    <div
      className={`account-sheet${visible ? ' is-visible' : ''}`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header>
          <h2 id={titleId}>选择账户</h2>
        </header>
        {loading && <p className="account-sheet__status">正在加载账户…</p>}
        {!loading && accounts.length === 0 && <p className="account-sheet__status">暂无可用账户</p>}
        {!loading && accounts.map((account) => (
          <button
            className={`account-sheet__row${selectedId === account.id ? ' is-selected' : ''}`}
            disabled={account.disabled}
            key={account.id ?? 'all'}
            type="button"
            onClick={() => onSelect(account)}
          >
            <WalletCards aria-hidden="true" size={22} />
            <span>{account.name}</span>
            {account.hint
              ? <span className="account-sheet__hint">{account.hint}</span>
              : selectedId === account.id && <Check aria-hidden="true" size={19} />}
          </button>
        ))}
      </section>
    </div>
  )
}
