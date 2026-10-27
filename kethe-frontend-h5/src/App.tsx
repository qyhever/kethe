import { loadIconCatalog } from './stores/icons'
import { MerchantListPage, MerchantEditPage } from './pages/MerchantPages'
import { ExpenseProjectListPage, ExpenseProjectEditPage, ExpenseProjectDetailPage } from './pages/ExpenseProjectPages'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { SettingsPage, AccountSecurityPage } from './pages/SettingsPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { HomePage } from './pages/HomePage'
import { ToastProvider } from './components/Toast'
import { ToastDemoPage } from './pages/ToastDemoPage'
import { FlowPage } from './pages/FlowPage'
import { SearchPage } from './pages/SearchPage'
import { TallyPage } from './pages/TallyPage'
import { AccountTransactionsPage } from './pages/AccountTransactionsPage'
import { ChartPage } from './pages/ChartPage'
import { BillPage } from './pages/BillPage'
import { MemberSettingsPage, MemberEditPage } from './pages/MemberSettingsPage'
import { UserProfilePage, UserProfileTextPage, UserProfileAvatarPage } from './pages/UserProfilePages'
import { ProfilePage } from './pages/ProfilePage'
import { AboutPage } from './pages/AboutPage'
import { FeedbackPage } from './pages/FeedbackPage'
import { ProfilePlaceholderPage } from './pages/ProfilePlaceholderPage'
import { CategorySettingsPage } from './pages/CategorySettingsPage'
import {
  AccountCreatePage,
  AccountDetailPage,
  AccountEditPage,
  AccountSettingsPage,
} from './pages/AccountSettingsPage'
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
  const { pathname } = useLocation()
  const versionNotificationRef = useRef<VersionUpdateNotificationRef>(null)
  const authStatus = useAuthStore(state => state.status)
  const initializeAuth = useAuthStore((state) => state.initialize)

  useEffect(() => {
    if (authStatus !== 'authenticated') return
    const refresh = () => { void loadIconCatalog().catch(() => { /* 保留已加载目录，下一次恢复可见时重试。 */ }) }
    refresh()
    const visible = () => { if (document.visibilityState === 'visible') refresh() }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', visible)
    const timer = window.setInterval(visible, 60_000)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', visible) }
  }, [authStatus])

  useLayoutEffect(() => {
    // 由应用控制滚动，避免浏览器在前进、后退时覆盖页面的滚动策略。
    const previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => {
      window.history.scrollRestoration = previousScrollRestoration
    }
  }, [])

  useLayoutEffect(() => {
    // 页面切换时在绘制前回顶；同页参数更新不重置，页面仍可主动恢复缓存位置。
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

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
          <Route path="/chart/account-transactions" element={<AccountTransactionsPage />} />
          <Route path="/chart" element={<ChartPage />} />
          <Route path="/bill" element={<BillPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/user" element={<UserProfilePage />} />
          <Route path="/profile/user/nickname" element={<UserProfileTextPage field="nickname" />} />
          <Route path="/profile/user/username" element={<UserProfileTextPage field="username" />} />
          <Route path="/profile/user/avatar" element={<UserProfileAvatarPage />} />
          <Route path="/profile/settings" element={<SettingsPage />} />
          <Route path="/profile/settings/security" element={<AccountSecurityPage />} />
          <Route path="/profile/settings/security/reset-password" element={<ResetPasswordPage />} />
          <Route path="/profile/categories" element={<CategorySettingsPage />} />
          <Route path="/profile/merchants" element={<MerchantListPage />} />
          <Route path="/profile/merchants/new" element={<MerchantEditPage />} />
          <Route path="/profile/merchants/:id/edit" element={<MerchantEditPage />} />
          <Route path="/profile/expense-projects" element={<ExpenseProjectListPage />} />
          <Route path="/profile/expense-projects/new" element={<ExpenseProjectEditPage />} />
          <Route path="/profile/expense-projects/:id" element={<ExpenseProjectDetailPage />} />
          <Route path="/profile/expense-projects/:id/edit" element={<ExpenseProjectEditPage />} />
          <Route path="/profile/members" element={<MemberSettingsPage />} />
          <Route path="/profile/members/new" element={<MemberEditPage />} />
          <Route path="/profile/members/:id/edit" element={<MemberEditPage />} />
          <Route path="/profile/accounts" element={<AccountSettingsPage />} />
          <Route path="/profile/accounts/new" element={<AccountCreatePage />} />
          <Route path="/profile/accounts/new/details" element={<AccountCreatePage details />} />
          <Route path="/profile/accounts/:id" element={<AccountDetailPage />} />
          <Route path="/profile/accounts/:id/edit" element={<AccountEditPage />} />
          <Route path="/profile/export" element={<ProfilePlaceholderPage title="数据导出" />} />
          <Route path="/profile/theme" element={<ProfilePlaceholderPage title="主题设置" />} />
          <Route path="/profile/currency" element={<ProfilePlaceholderPage title="货币设置" />} />
          <Route path="/profile/about" element={<AboutPage />} />
          <Route path="/profile/feedback" element={<FeedbackPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/tally/*" element={<TallyPage />} />
          <Route path="/toast-demo" element={<ToastDemoPage />} />
        </Route>
        <Route element={<RequireAnonymous />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<Navigate replace to="/forgot-password" />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ToastProvider>
  )
}

export default App
