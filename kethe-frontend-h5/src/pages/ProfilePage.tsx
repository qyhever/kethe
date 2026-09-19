import {
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  Folder,
  Globe2,
  Info,
  LogOut,
  MessageCircle,
  Palette,
  Settings,
  WalletCards,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import fallbackAvatar from '../assets/avatar.svg'
import { Tabbar, type TabId } from '../components/Tarbar'
import { useAuthStore } from '../stores/auth'
import './ProfilePage.css'

interface ProfileMenuItem {
  label: string
  path: string
  icon: LucideIcon
  tone: 'blue' | 'green' | 'purple' | 'coral' | 'gray' | 'teal'
}

const menuGroups: ProfileMenuItem[][] = [
  [
    { label: '分类设置', path: '/profile/categories', icon: Folder, tone: 'blue' },
    { label: '账户设置', path: '/profile/accounts', icon: WalletCards, tone: 'green' },
  ],
  [
    { label: '数据导出', path: '/profile/export', icon: ChartNoAxesColumnIncreasing, tone: 'purple' },
    { label: '主题设置', path: '/profile/theme', icon: Palette, tone: 'coral' },
    { label: '货币设置', path: '/profile/currency', icon: Globe2, tone: 'gray' },
  ],
  [
    { label: '关于产品', path: '/profile/about', icon: Info, tone: 'blue' },
    { label: '意见反馈', path: '/profile/feedback', icon: MessageCircle, tone: 'teal' },
  ],
]

export function ProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const signOut = useAuthStore((state) => state.signOut)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const avatar = !avatarFailed && user?.avatar ? user.avatar : fallbackAvatar
  const displayName = user?.nickname?.trim() || user?.username?.trim() || '用户'

  useEffect(() => {
    setAvatarFailed(false)
  }, [user?.avatar])

  const handleTab = (tab: TabId) => {
    if (tab === 'profile') return
    const destinations: Record<Exclude<TabId, 'profile'>, string> = {
      home: '/home',
      chart: '/chart',
      add: '/tally',
      bill: '/bill',
    }
    navigate(destinations[tab])
  }

  return (
    <div className="profile-page">
      <main className="profile-content">
        <header className="profile-header">
          <h1>我的</h1>
          <button type="button" aria-label="打开设置" onClick={() => navigate('/profile/settings')}>
            <Settings aria-hidden="true" size={30} strokeWidth={2} />
          </button>
        </header>

        <button className="profile-user-card" type="button" onClick={() => navigate('/profile/user')}>
          <span className="profile-avatar-wrap">
            <img src={avatar} alt="" onError={() => setAvatarFailed(true)} />
          </span>
          <span className="profile-user-copy">
            <strong>{displayName}</strong>
            <span>{user?.email || '暂无邮箱信息'}</span>
          </span>
          <ChevronRight className="profile-chevron" aria-hidden="true" size={22} />
        </button>

        <div className="profile-menu-list">
          {menuGroups.map((group, groupIndex) => (
            <section className="profile-menu-group" aria-label={`设置分组 ${groupIndex + 1}`} key={groupIndex}>
              {group.map(({ label, path, icon: MenuIcon, tone }) => (
                <button type="button" key={path} onClick={() => navigate(path)}>
                  <span className={`profile-menu-icon profile-menu-icon--${tone}`}>
                    <MenuIcon aria-hidden="true" size={23} strokeWidth={2} />
                  </span>
                  <span className="profile-menu-label">{label}</span>
                  <ChevronRight className="profile-chevron" aria-hidden="true" size={21} />
                </button>
              ))}
            </section>
          ))}
        </div>

        <button className="profile-sign-out" type="button" onClick={signOut}>
          <LogOut aria-hidden="true" size={18} />
          退出登录
        </button>
        <p className="profile-version">v1.0.0</p>
      </main>
      <Tabbar activeTab="profile" onTabClick={handleTab} />
    </div>
  )
}
