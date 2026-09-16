import {
  House,
  ChartNoAxesColumnIncreasing,
  Plus,
  ReceiptText,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import './index.css'
import { clsx } from 'clsx'

export type TabId = 'home' | 'chart' | 'add' | 'bill' | 'profile'

type Tab = {
  id: TabId
  label: string
  icon: LucideIcon
}

const tabs: Tab[] = [
  { id: 'home', label: '首页', icon: House },
  { id: 'chart', label: '图表', icon: ChartNoAxesColumnIncreasing },
  { id: 'add', label: '记账', icon: Plus },
  { id: 'bill', label: '账单', icon: ReceiptText },
  { id: 'profile', label: '我的', icon: UserRound },
]

interface TabbarProps {
  activeTab?: TabId
  onTabClick?: (tabId: TabId) => void
}

export function Tabbar({ activeTab = 'home', onTabClick }: TabbarProps) {
  const handleTabClick = (value: TabId) => {
    onTabClick?.(value)
  }

  return (
    <div className="tabbar-container">
      <nav className="tabbar" aria-label="主导航">
        <div className="tabbar-inner">
          {tabs.map((tab) => {
            const Icon = tab.icon

            if (tab.id === 'add') {
              return (
                <div className="tabbar-center" key={tab.id}>
                  <button
                    className="tabbar-add"
                    type="button"
                    aria-label="记一笔"
                    onClick={() => handleTabClick(tab.id)}
                  >
                    <Icon aria-hidden="true" size={30} strokeWidth={2.2} />
                  </button>
                  <span className="tabbar-add-label">{tab.label}</span>
                </div>
              )
            }

            return (
              <button
                key={tab.id}
                className={clsx('tabbar-item', {
                  'is-active': activeTab === tab.id,
                })}
                type="button"
                aria-current={activeTab === tab.id ? "page" : undefined}
                onClick={() => handleTabClick(tab.id)}
              >
                <Icon aria-hidden="true" size={22} strokeWidth={1.9} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
