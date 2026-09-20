import { useEffect, useRef } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegisterPage } from './pages/RegisterPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { HomePage } from './pages/HomePage'
import { ToastProvider } from './components/Toast'
import { ToastDemoPage } from './pages/ToastDemoPage'
import { FlowPage } from './pages/FlowPage'
import { SearchPage } from './pages/SearchPage'
import { TallyPage } from './pages/TallyPage'
import { ChartPage } from './pages/ChartPage'
import { BillPage } from './pages/BillPage'
import { ProfilePage } from './pages/ProfilePage'
import { ProfilePlaceholderPage } from './pages/ProfilePlaceholderPage'
import { CategorySettingsPage } from './pages/CategorySettingsPage'
import { AccountSettingsPage } from './pages/AccountSettingsPage'
import { RequireAnonymous, RequireAuth } from './components/Auth/RouteGuards'
import { useAuthStore } from './stores/auth'

import {
  VersionUpdateNotification,
  type VersionUpdateNotificationRef,
} from './components/VersionUpdateNotification'
import { versionChecker } from './utils/version-checker'

import './styles/index.css'
import './styles/tailwind.css'


function App() {
  const versionNotificationRef = useRef<VersionUpdateNotificationRef>(null)
  const initializeAuth = useAuthStore((state) => state.initialize)

  useEffect(() => {
    void initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    // 启动版本检测
    if (import.meta.env.VITE_APP_MODE_ENV !== 'dev') {
      versionChecker.start((info) => {
        console.log('检测到新版本:', info)
        versionNotificationRef.current?.open(info)
      })
    }
    return () => {
      // 停止版本检测
      versionChecker.stop()
    }
  }, [])

  return (
    <ToastProvider>
      <VersionUpdateNotification ref={versionNotificationRef} />
      <Routes>
        <Route path="/" element={<Navigate replace to="/home" />} />
        <Route element={<RequireAuth />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/flow" element={<FlowPage />} />
          <Route path="/chart" element={<ChartPage />} />
          <Route path="/bill" element={<BillPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/user" element={<ProfilePlaceholderPage title="个人资料" />} />
          <Route path="/profile/settings" element={<ProfilePlaceholderPage title="设置" />} />
          <Route path="/profile/categories" element={<CategorySettingsPage />} />
          <Route path="/profile/accounts" element={<AccountSettingsPage />} />
          <Route path="/profile/export" element={<ProfilePlaceholderPage title="数据导出" />} />
          <Route path="/profile/theme" element={<ProfilePlaceholderPage title="主题设置" />} />
          <Route path="/profile/currency" element={<ProfilePlaceholderPage title="货币设置" />} />
          <Route path="/profile/about" element={<ProfilePlaceholderPage title="关于产品" />} />
          <Route path="/profile/feedback" element={<ProfilePlaceholderPage title="意见反馈" />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/tally/*" element={<TallyPage />} />
          <Route path="/toast-demo" element={<ToastDemoPage />} />
        </Route>
        <Route element={<RequireAnonymous />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ToastProvider>
  )
}

export default App
