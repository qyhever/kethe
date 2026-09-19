import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { resetPassword, sendPasswordResetCode } from '../api/auth'
import resetPasswordHero from '../assets/reset-password-hero.svg'
import { AuthField } from '../components/Auth/AuthField'
import { useToast } from '../components/Toast'
import './ResetPasswordPage.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '操作失败，请稍后重试'
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newPasswordVisible, setNewPasswordVisible] = useState(false)
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [sendingCode, setSendingCode] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (countdown <= 0) return
    const timer = window.setTimeout(() => setCountdown((current) => current - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  const handleSendCode = async () => {
    const normalizedEmail = email.trim()
    if (countdown > 0 || sendingCode) return
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      toast.error('请输入有效的邮箱地址')
      return
    }

    setSendingCode(true)
    try {
      await sendPasswordResetCode(normalizedEmail)
      setCountdown(60)
      toast.success('验证码已发送')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSendingCode(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    setSubmitting(true)
    try {
      await resetPassword({
        email: email.trim(),
        verificationCode,
        newPassword,
      })
      toast.success('密码重置成功，请重新登录')
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main
      className="reset-password-page"
    >
      <div className="reset-password-page__content">
        <header className="reset-password-header">
          <Link className="reset-password-header__back" to="/login" aria-label="返回登录">
            <ChevronLeft aria-hidden="true" size={30} strokeWidth={2.2} />
          </Link>
          <span>重置密码</span>
        </header>

        <section className="reset-password-intro" aria-labelledby="reset-password-title">
          <img src={resetPasswordHero} alt="lock" />
          <h1 id="reset-password-title">重置密码</h1>
          <p>通过邮箱验证码重置你的账户密码</p>
        </section>

        <form className="reset-password-form" onSubmit={handleSubmit}>
          <div className="reset-password-form__group">
            <label htmlFor="resetEmail">邮箱</label>
            <AuthField
              icon={Mail}
              id="resetEmail"
              type="email"
              autoComplete="one-time-code"
              placeholder="请输入邮箱地址"
              onChange={(event) => setEmail(event.target.value)}
              required
              value={email}
            />
          </div>

          <div className="reset-password-form__group">
            <label htmlFor="resetVerificationCode">验证码</label>
            <AuthField
              icon={ShieldCheck}
              id="resetVerificationCode"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              pattern="[0-9]{6}"
              placeholder="请输入验证码"
              onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ''))}
              required
              value={verificationCode}
              trailing={
                <button
                  className="auth-field__trailing"
                  disabled={countdown > 0 || sendingCode}
                  onClick={handleSendCode}
                  type="button"
                >
                  {sendingCode ? '发送中…' : countdown > 0 ? `${countdown}s 后重发` : '发送验证码'}
                </button>
              }
            />
          </div>

          <div className="reset-password-form__group">
            <label htmlFor="resetNewPassword">新密码</label>
            <AuthField
              icon={LockKeyhole}
              id="resetNewPassword"
              type={newPasswordVisible ? 'text' : 'password'}
              minLength={8}
              placeholder="请输入新密码"
              autoComplete="off"
              onChange={(event) => setNewPassword(event.target.value)}
              onTogglePassword={() => setNewPasswordVisible((visible) => !visible)}
              passwordVisible={newPasswordVisible}
              required
              value={newPassword}
            />
          </div>

          <div className="reset-password-form__group">
            <label htmlFor="resetConfirmPassword">确认密码</label>
            <AuthField
              icon={LockKeyhole}
              id="resetConfirmPassword"
              type={confirmPasswordVisible ? 'text' : 'password'}
              minLength={8}
              placeholder="请再次输入新密码"
              autoComplete="off"
              onChange={(event) => setConfirmPassword(event.target.value)}
              onTogglePassword={() => setConfirmPasswordVisible((visible) => !visible)}
              passwordVisible={confirmPasswordVisible}
              required
              value={confirmPassword}
            />
          </div>

          <button className="reset-password-form__submit" disabled={submitting} type="submit">
            <span>{submitting ? '重置中…' : '确认重置'}</span>
          </button>
        </form>

        <Link className="reset-password-page__login" to="/login">返回登录</Link>
      </div>
    </main>
  )
}
