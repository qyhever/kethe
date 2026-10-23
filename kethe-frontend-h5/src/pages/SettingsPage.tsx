import { SettingsHeader } from '../components/SettingsHeader'
import { ChevronRight, LockKeyhole, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import './SettingsPage.css'

interface SettingsMenuPageProps {
  title: string
  backTo: string
  backLabel: string
  label: string
  description: string
  to: string
  icon: LucideIcon
}

function SettingsMenuPage({ title, backTo, backLabel, label, description, to, icon: Icon }: SettingsMenuPageProps) {
  return (
    <main className="settings-page settings-layout" aria-labelledby="settings-title">
      <SettingsHeader title={title} titleId="settings-title" backTo={backTo} backLabel={backLabel} />
      <nav className="settings-page__menu" aria-label={title}>
        <Link className="settings-page__item" to={to}>
          <span className="settings-page__icon"><Icon aria-hidden="true" size={23} /></span>
          <span className="settings-page__copy">
            <strong>{label}</strong>
            <span>{description}</span>
          </span>
          <ChevronRight aria-hidden="true" size={21} />
        </Link>
      </nav>
    </main>
  )
}

export function SettingsPage() {
  return (
    <SettingsMenuPage
      title="设置"
      backTo="/profile"
      backLabel="返回我的页面"
      label="账号与安全"
      description="管理登录账号与密码安全"
      to="/profile/settings/security"
      icon={ShieldCheck}
    />
  )
}

export function AccountSecurityPage() {
  return (
    <SettingsMenuPage
      title="账号与安全"
      backTo="/profile/settings"
      backLabel="返回设置"
      label="重置密码"
      description="通过绑定邮箱验证码重置密码"
      to="/profile/settings/security/reset-password"
      icon={LockKeyhole}
    />
  )
}
