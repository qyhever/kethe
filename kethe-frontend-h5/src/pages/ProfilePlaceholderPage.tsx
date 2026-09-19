import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './ProfilePlaceholderPage.css'

interface ProfilePlaceholderPageProps {
  title: string
}

export function ProfilePlaceholderPage({ title }: ProfilePlaceholderPageProps) {
  const navigate = useNavigate()

  return (
    <main className="profile-placeholder" aria-labelledby="profile-placeholder-title">
      <header>
        <button type="button" aria-label="返回我的页面" onClick={() => navigate('/profile')}>
          <ArrowLeft aria-hidden="true" size={24} />
        </button>
        <h1 id="profile-placeholder-title">{title}</h1>
        <span aria-hidden="true" />
      </header>
      <div className="profile-placeholder__body" />
    </main>
  )
}
