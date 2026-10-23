import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import './SettingsHeader.css'

type SettingsHeaderProps = {
  title: string
  titleId?: string
  backLabel?: string
  action?: ReactNode
} & ({ backTo: string; onBack?: never } | { backTo?: never; onBack: () => void })

export function SettingsHeader({ title, titleId, backLabel = '返回', backTo, onBack, action }: SettingsHeaderProps) {
  return (
    <header className="settings-header">
      {backTo !== undefined ? (
        <Link className="settings-header__back" to={backTo} aria-label={backLabel}>
          <ChevronLeft aria-hidden="true" size={24} />
        </Link>
      ) : (
        <button className="settings-header__back" type="button" aria-label={backLabel} onClick={onBack}>
          <ChevronLeft aria-hidden="true" size={24} />
        </button>
      )}
      <h1 id={titleId}>{title}</h1>
      <span className="settings-header__action">{action}</span>
    </header>
  )
}
