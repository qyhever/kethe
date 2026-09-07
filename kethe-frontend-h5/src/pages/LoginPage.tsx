import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail } from 'lucide-react'
import { login } from '../api/auth'
import { AuthField } from '../components/Auth/AuthField'
import { AuthScaffold } from '../components/Auth/AuthScaffold'
import { useToast } from '../components/Toast'
import { useAuthStore } from '../stores/auth'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '登录失败，请稍后重试'
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const signIn = useAuthStore((state) => state.signIn)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const tokens = await login({ email, password })
      await signIn(tokens)
      const from = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from
      const destination = from?.pathname
        ? `${from.pathname}${from.search || ''}${from.hash || ''}`
        : '/home'
      navigate(destination, { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthScaffold variant="login">
      <form className="auth-form" onSubmit={handleLogin}>
        <div className="auth-form__fields">
          <AuthField
            icon={Mail}
            id="email"
            type="email"
            autoComplete="off"
            aria-label="邮箱"
            placeholder="请输入邮箱"
            onChange={(event) => setEmail(event.target.value)}
            required
            value={email}
          />
          <AuthField
            icon={LockKeyhole}
            id="password"
            type={passwordVisible ? 'text' : 'password'}
            autoComplete="off"
            aria-label="密码"
            placeholder="请输入密码"
            onChange={(event) => setPassword(event.target.value)}
            onTogglePassword={() => setPasswordVisible((visible) => !visible)}
            passwordVisible={passwordVisible}
            required
            value={password}
          />
        </div>
        <button
          className="auth-form__forgot"
          type="button"
          onClick={() => toast.info('请联系管理员重置密码')}
        >
          忘记密码？
        </button>
        <button className="auth-form__submit" disabled={submitting} type="submit">
          {submitting ? '登录中…' : '登录'}
        </button>
        <p className="auth-form__switch">
          还没有账号？
          <Link to="/register">立即注册</Link>
        </p>
      </form>
    </AuthScaffold>
  )
}
