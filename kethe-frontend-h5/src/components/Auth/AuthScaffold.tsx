import type { ReactNode } from 'react'
import brandLogo from '../../assets/keshe_login_top_logo.svg'
import bottomLandscape from '../../assets/keshe_login_bottom_background.svg'
import './Auth.css'

interface AuthScaffoldProps {
  children: ReactNode
  variant: 'login' | 'register'
}

export function AuthScaffold({ children, variant }: AuthScaffoldProps) {

  return (
    <main className={`auth-page auth-page--${variant}`}>
      <div className="auth-page__content">

        <section className="auth-main" aria-labelledby="auth-brand-name">
          <div className="auth-brand">
            <img src={brandLogo} alt="" />
            <span className="auth-brand__sr-title" id="auth-brand-name">刻合</span>
            <p>认真生活，从一笔开始</p>
          </div>
          {children}
        </section>
      </div>

      <img className="auth-page__landscape" src={bottomLandscape} alt="" />
      <div className="auth-page__slogan" aria-label="记录每一份收支，让生活更清晰">
        <span aria-hidden="true" />
        <p>记录每一份收支&nbsp;&nbsp; 让生活更清晰</p>
        <span aria-hidden="true" />
      </div>
    </main>
  )
}

