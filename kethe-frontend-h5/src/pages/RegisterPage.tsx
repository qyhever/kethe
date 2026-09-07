import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { login, register, sendRegistrationCode } from '../api/auth'
import { AuthField } from '../components/Auth/AuthField'
import { AuthScaffold } from '../components/Auth/AuthScaffold'
import { useToast } from '../components/Toast'
import { useAuthStore } from '../stores/auth'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '操作失败，请稍后重试'
}

function getDefaultProfile(email: string) {
  const emailName = email.trim().split('@')[0] || 'user'
  return {
    username: emailName,
    nickname: emailName,
  }
}

export function RegisterPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const signIn = useAuthStore((state) => state.signIn)
  const [email, setEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyCountdown, setVerifyCountdown] = useState(0)
  const [sendingCode, setSendingCode] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!verifyCountdown) return
    const timer = window.setInterval(() => {
      setVerifyCountdown((current) => Math.max(current - 1, 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [verifyCountdown])

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const profile = getDefaultProfile(email)
      await register({
        ...profile,
        email,
        password: registerPassword,
        verificationCode: verifyCode,
      })
      const tokens = await login({ email, password: registerPassword })
      await signIn(tokens)
      toast.success('注册成功')
      navigate('/home', { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const sendVerifyCode = async () => {
    if (verifyCountdown > 0 || !email.trim()) return
    setSendingCode(true)
    try {
      await sendRegistrationCode(email)
      setVerifyCountdown(60)
      toast.success('验证码已发送')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSendingCode(false)
    }
  }

  return (
    <AuthScaffold variant="register">
      <form className="auth-form" onSubmit={handleRegister}>
        <div className="auth-form__fields">
          <AuthField
            icon={Mail}
            id="registerEmail"
            type="email"
            autoComplete="off"
            aria-label="邮箱"
            placeholder="请输入邮箱"
            onChange={(event) => setEmail(event.target.value)}
            required
            value={email}
          />
          <div>
            <AuthField
              icon={LockKeyhole}
              id="registerPassword"
              type={passwordVisible ? 'text' : 'password'}
              autoComplete="off"
              aria-label="设置密码"
              minLength={8}
              placeholder="设置密码"
              onChange={(event) => setRegisterPassword(event.target.value)}
              onTogglePassword={() => setPasswordVisible((visible) => !visible)}
              passwordVisible={passwordVisible}
              required
              value={registerPassword}
            />
            <p className="auth-form__hint">密码需包含至少 8 位字符，建议包含字母、数字和符号</p>
          </div>
          <AuthField
            icon={ShieldCheck}
            id="verifyCode"
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="验证码"
            maxLength={6}
            pattern="[0-9]{6}"
            placeholder="请输入验证码"
            onChange={(event) => setVerifyCode(event.target.value.replace(/\D/g, ''))}
            required
            value={verifyCode}
            trailing={
              <button
                className="auth-field__trailing"
                disabled={verifyCountdown > 0 || sendingCode || !email.trim()}
                onClick={sendVerifyCode}
                type="button"
              >
                {sendingCode ? '发送中…' : verifyCountdown > 0 ? `${verifyCountdown}s 后重发` : '发送验证码'}
              </button>
            }
          />
        </div>
        <button className="auth-form__submit" disabled={submitting} type="submit">
          {submitting ? '注册中…' : '注册'}
        </button>
        <p className="auth-form__switch">
          已有账号？
          <Link to="/login">去登录</Link>
        </p>
      </form>
    </AuthScaffold>
  )
}
