import { useEffect, useRef } from 'react'
import { Route, Routes } from 'react-router-dom'
// import { Navigate } from 'react-router-dom'
// import { hasTokens } from './api/token'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegisterPage } from './pages/RegisterPage'

import {
  VersionUpdateNotification,
  type VersionUpdateNotificationRef,
} from './components/VersionUpdateNotification'
import { versionChecker } from './utils/version-checker'

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
    <>
      <VersionUpdateNotification ref={versionNotificationRef} />
      <Routes>
        {/* <Route path="/" element={<AuthRedirect />} /> */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/home" element={'home'} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
