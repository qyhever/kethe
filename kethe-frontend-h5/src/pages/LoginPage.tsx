import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { hasTokens, setTokens } from '../api/token'
import { Icon } from '../components/Icon'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (hasTokens()) {
    return <Navigate replace to="/clipboard" />
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const tokens = await login({ email, password })
      setTokens(tokens)
      navigate('/clipboard', { replace: true })
    } catch (error) {
      console.log('error: ', error)
      // showToast(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <section className="login-screen">
        <form className="panel login-card" onSubmit={handleLogin}>
          {/* <Brand subtitle="personal clipboard" title="Kethe Clip" /> */}
          <div className="field">
            <label htmlFor="email">邮箱</label>
            <input id="email" type="email" autoComplete="email" onChange={(event) => setEmail(event.target.value)} required value={email} />
          </div>
          <div className="field">
            <label htmlFor="password">密码</label>
            <input id="password" type="password" autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} required value={password} />
          </div>
          <div className="composer-actions">
            <button className="primary" disabled={submitting} type="submit">
              <Icon name="login" />
              {submitting ? '登录中' : '登录'}
            </button>
          </div>
          <p className="auth-switch">
            没有账号？
            <Link className="link-button" to="/register">
              注册账号
            </Link>
          </p>
        </form>
      </section>
    </>
  )
}
