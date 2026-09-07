import { Link, useLocation } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useAuthStore } from '../stores/auth'

export function NotFoundPage() {
  const location = useLocation()
  const signedIn = useAuthStore((state) => state.status === 'authenticated')
  const destination = signedIn ? '/home' : '/login'

  return (
    <section className="not-found-screen" aria-labelledby="not-found-title">
      <Link aria-label="返回 Kethe Clip" className="not-found-brand" to={destination}>
        返回
      </Link>

      <div className="not-found-visual" aria-hidden="true">
        <span>4</span>
        <span className="not-found-zero">
          <i />
        </span>
        <span>4</span>
      </div>

      <div className="not-found-content">
        <p className="not-found-kicker">ERROR / PAGE NOT FOUND</p>
        <h1 id="not-found-title">这里没有你要找的内容</h1>
        <p>
          地址可能已失效，或页面已经被移动。你可以返回{signedIn ? '首页' : '登录页'}继续使用。
        </p>
        <Link className="primary not-found-action" to={destination}>
          <Icon name={signedIn ? 'clipboard' : 'login'} />
          {signedIn ? '返回首页' : '前往登录'}
        </Link>
      </div>

      <p className="not-found-path" title={location.pathname}>
        <span>REQUEST</span>
        {location.pathname}
      </p>
    </section>
  )
}
