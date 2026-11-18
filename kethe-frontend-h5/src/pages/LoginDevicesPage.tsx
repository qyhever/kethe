import { useEffect, useState } from 'react'
import { MonitorSmartphone } from 'lucide-react'
import { fetchLoginSessions, revokeLoginSession } from '../api/auth'
import type { LoginSession, LoginSessions } from '../api/types'
import { Dialog } from '../components/Dialog/Dialog'
import { SettingsHeader } from '../components/SettingsHeader'
import { useToast } from '../components/Toast'
import './SettingsPage.css'
import './LoginDevicesPage.css'

const dateFormat = new Intl.DateTimeFormat('zh-CN', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function LoginDevicesPage() {
  const toast = useToast()
  const [data, setData] = useState<LoginSessions | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [pending, setPending] = useState<LoginSession | null>(null)
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetchLoginSessions(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result)
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true)
      })
    return () => controller.abort()
  }, [attempt])

  const confirmRevoke = async () => {
    if (!pending) return
    setRevoking(true)
    try {
      await revokeLoginSession(pending.id)
      setData((current) => current && {
        ...current,
        sessions: current.sessions.filter(({ id }) => id !== pending.id),
      })
      setPending(null)
      toast.success('已退出该设备')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '退出设备失败，请重试')
    } finally {
      setRevoking(false)
    }
  }

  return (
    <main className="settings-page settings-layout" aria-labelledby="devices-title">
      <SettingsHeader
        title="登录设备"
        titleId="devices-title"
        backTo="/profile/settings/security"
        backLabel="返回账号与安全"
      />
      {data?.currentSessionId === null && (
        <p className="login-devices__notice">本次登录暂未纳入设备管理，重新登录后可显示</p>
      )}
      {failed ? (
        <div className="settings-page__menu login-devices__state">
          <p role="status">登录设备加载失败</p>
          <button type="button" onClick={() => {
            setFailed(false)
            setAttempt((count) => count + 1)
          }}>重试</button>
        </div>
      ) : !data || data.sessions.length === 0 ? (
        <p className="settings-page__menu login-devices__state" role="status">
          {data ? '暂无有效登录设备' : '正在加载登录设备…'}
        </p>
      ) : (
        <ul className="settings-page__menu login-devices__list">
          {data.sessions.map((device) => (
            <li className="login-devices__item" key={device.id}>
              <span className="settings-page__icon">
                <MonitorSmartphone size={22} aria-hidden="true" />
              </span>
              <div className="login-devices__copy">
                <strong>{device.deviceLabel}</strong>
                <span>登录于 <time dateTime={device.createdAt}>{dateFormat.format(new Date(device.createdAt))}</time></span>
                <span>最近活跃 <time dateTime={device.lastActiveAt}>{dateFormat.format(new Date(device.lastActiveAt))}</time></span>
              </div>
              {device.id === data.currentSessionId ? (
                <span className="login-devices__current">当前设备</span>
              ) : (
                <button type="button" onClick={() => setPending(device)} aria-label={`退出设备 ${device.deviceLabel}`}>
                  退出
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <Dialog
        open={pending !== null}
        title="退出设备"
        description={pending ? `确定退出“${pending.deviceLabel}”吗？该设备需要重新登录。` : undefined}
        confirmText="退出设备"
        danger
        loading={revoking}
        onConfirm={confirmRevoke}
        onCancel={() => setPending(null)}
      />
    </main>
  )
}
