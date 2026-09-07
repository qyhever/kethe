import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/auth'

function AuthChecking() {
  return (
    <main className="auth-checking" aria-live="polite" aria-busy="true">
      正在验证登录状态…
    </main>
  )
}

export function RequireAuth() {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()

  if (status === 'checking') return <AuthChecking />
  if (status === 'anonymous') {
    return <Navigate replace to="/login" state={{ from: location }} />
  }

  return <Outlet />
}

export function RequireAnonymous() {
  const status = useAuthStore((state) => state.status)

  if (status === 'checking') return <AuthChecking />
  if (status === 'authenticated') return <Navigate replace to="/home" />

  return <Outlet />
}
