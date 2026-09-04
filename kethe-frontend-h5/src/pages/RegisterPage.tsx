import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { login, register, sendRegistrationCode } from '../api/auth'
import { hasTokens, setTokens } from '../api/token'

export function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyCountdown, setVerifyCountdown] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!verifyCountdown) return
    const timer = window.setInterval(() => {
      setVerifyCountdown((current) => Math.max(current - 1, 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [verifyCountdown])

  if (hasTokens()) {
    return <Navigate replace to="/clipboard" />
  }

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (registerPassword !== confirmPassword) {
      // showToast('两次密码不一致')
      return
    }
    setSubmitting(true)
    try {
      await register({
        username,
        nickname,
        email,
        password: registerPassword,
        verificationCode: verifyCode,
      })
      const tokens = await login({ email, password: registerPassword })
      setTokens(tokens)
      // showToast('注册成功，已登录')
      navigate('/clipboard', { replace: true })
    } catch (error) {
      console.log('error: ', error);
      // showToast(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const sendVerifyCode = async () => {
    if (verifyCountdown > 0 || !email.trim()) return
    setSubmitting(true)
    try {
      await sendRegistrationCode(email)
      setVerifyCountdown(60)
      // showToast('验证码已发送')
    } catch (error) {
      console.log('error: ', error);
      // showToast(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <section className="login-screen">
        <form className="panel login-card" onSubmit={handleRegister}>
          {/* <Brand subtitle="create clipboard account" title="注册账号" /> */}
          <div className="field">
            <label htmlFor="registerEmail">邮箱</label>
            <input id="registerEmail" type="email" autoComplete="email" onChange={(event) => setEmail(event.target.value)} required value={email} />
          </div>
          <div className="field">
            <label htmlFor="username">用户名</label>
            <input id="username" autoComplete="username" onChange={(event) => setUsername(event.target.value)} required value={username} />
          </div>
          <div className="field">
            <label htmlFor="nickname">昵称</label>
            <input id="nickname" onChange={(event) => setNickname(event.target.value)} required value={nickname} />
          </div>
          <div className="field">
            <label htmlFor="verifyCode">验证码</label>
            <div className="verify-row">
              <input id="verifyCode" inputMode="numeric" maxLength={6} onChange={(event) => setVerifyCode(event.target.value)} placeholder="6 位验证码" required value={verifyCode} />
              <button className="ghost" disabled={verifyCountdown > 0 || submitting} onClick={sendVerifyCode} type="button">
                {verifyCountdown > 0 ? `${verifyCountdown}s` : '发送验证码'}
              </button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="registerPassword">密码</label>
            <input id="registerPassword" type="password" autoComplete="new-password" onChange={(event) => setRegisterPassword(event.target.value)} required value={registerPassword} />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">确认密码</label>
            <input id="confirmPassword" type="password" autoComplete="new-password" onChange={(event) => setConfirmPassword(event.target.value)} required value={confirmPassword} />
          </div>
          <div className="composer-actions">
            <button className="primary" disabled={submitting} type="submit">
              {/* <Icon name="userPlus" /> */}
              {submitting ? '提交中' : '注册并登录'}
            </button>
          </div>
          <p className="auth-switch">
            已有账号？
            <Link className="link-button" to="/login">
              返回登录
            </Link>
          </p>
        </form>
      </section>
    </>
  )
}
