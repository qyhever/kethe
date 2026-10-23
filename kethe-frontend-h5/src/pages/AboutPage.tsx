import { SettingsHeader } from '../components/SettingsHeader'
import {
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  ListFilter,
  MessageCircle,
  NotebookPen,
  Settings,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import brandLogo from '../assets/keshe_login_top_logo.svg'
import { APP_VERSION } from '../constants/app'
import './AboutPage.css'

const features = [
  { title: '日常记账', description: '记录支出、收入和账户转账。', icon: NotebookPen },
  { title: '流水与账单', description: '筛选历史流水，查看年度及月度收支与结余。', icon: ListFilter },
  { title: '收支分析', description: '查看周、月、年趋势、分类占比及收支排行。', icon: ChartNoAxesColumnIncreasing },
  { title: '灵活管理', description: '管理账户、分类、成员和消费项目。', icon: Settings },
]

export function AboutPage() {
  return (
    <main className="about-page settings-layout" aria-labelledby="about-title">
      <SettingsHeader title="关于产品" titleId="about-title" backTo="/profile" backLabel="返回我的页面" />

      <section className="about-brand" aria-labelledby="about-brand-name">
        <img src={brandLogo} alt="" className="about-brand__logo" />
        <h2 id="about-brand-name">刻合 Kethe</h2>
        <p className="about-brand__tagline">认真生活，从一笔开始</p>
        <p className="about-brand__description">
          轻量、清晰的个人记账工具，帮助你记录日常收支，了解资金去向。
        </p>
      </section>

      <section className="about-features" aria-labelledby="about-features-title">
        <h2 id="about-features-title">用刻合，记录生活</h2>
        <ul>
          {features.map(({ title, description, icon: Icon }) => (
            <li key={title}>
              <span className="about-features__icon">
                <Icon aria-hidden="true" size={22} />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="about-page__footer">
        <p className="about-page__version">当前版本 <span>{APP_VERSION}</span></p>
        <Link className="about-page__feedback" to="/profile/feedback">
          <MessageCircle aria-hidden="true" size={20} />
          <span>意见反馈</span>
          <ChevronRight aria-hidden="true" size={18} />
        </Link>
      </footer>
    </main>
  )
}
