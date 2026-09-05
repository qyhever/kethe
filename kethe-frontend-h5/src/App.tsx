import { useEffect, useRef } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
// import { hasTokens } from './api/token'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegisterPage } from './pages/RegisterPage'
import { HomePage } from './pages/HomePage'
import { ToastProvider } from './components/Toast'
import { ToastDemoPage } from './pages/ToastDemoPage'
import { FlowPage } from './pages/FlowPage'
import { SearchPage } from './pages/SearchPage'

import {
  VersionUpdateNotification,
  type VersionUpdateNotificationRef,
} from './components/VersionUpdateNotification'
import { versionChecker } from './utils/version-checker'

import './styles/index.css'
import './styles/tailwind.css'


// function AuthRedirect() {
//   return <Navigate replace to={hasTokens() ? '/clipboard' : '/login'} />
// }

function App() {
  const versionNotificationRef = useRef<VersionUpdateNotificationRef>(null)

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
        <Route path="/home" element={<HomePage />} />
        <Route path="/flow" element={<FlowPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/toast-demo" element={<ToastDemoPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ToastProvider>
  )
}

export default App
