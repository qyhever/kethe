import { SettingsHeader } from '../components/SettingsHeader'
import { useNavigate } from 'react-router-dom'
import './ProfilePlaceholderPage.css'

interface ProfilePlaceholderPageProps {
  title: string
}

export function ProfilePlaceholderPage({ title }: ProfilePlaceholderPageProps) {
  const navigate = useNavigate()

  return (
    <main className="profile-placeholder settings-layout" aria-labelledby="profile-placeholder-title">
      <SettingsHeader title={title} titleId="profile-placeholder-title" onBack={() => navigate('/profile')} backLabel="返回我的页面" />
      <div className="profile-placeholder__body" />
    </main>
  )
}
