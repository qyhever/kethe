import { useState, forwardRef, useImperativeHandle } from 'react'
import { versionChecker, type UpdateInfo } from '@/utils/version-checker.ts'
import './VersionUpdateNotification.css'

export interface VersionUpdateNotificationRef {
  open: (info: UpdateInfo) => void
  close: () => void
}

export const VersionUpdateNotification = forwardRef<VersionUpdateNotificationRef>((_, ref) => {
  const [visible, setVisible] = useState(false)
  const [visibleInfo, setVisibleInfo] = useState<UpdateInfo>({} as UpdateInfo)
  const versionExtraInfoVisible = true

  useImperativeHandle(ref, () => ({
    open: (info: UpdateInfo) => {
      setVisible(true)
      setVisibleInfo(info)
    },
    close: () => {
      setVisible(false)
    },
  }))

  const handleUpdate = () => {
    versionChecker.refresh()
  }

  const handleClose = () => {
    setVisible(false)
  }

  const handleLater = () => {
    handleClose()
    // 5分钟后再次提醒
    setTimeout(
      () => {
        setVisible(true)
        // visibleInfo 仍然保持最新的 info
      },
      5 * 60 * 1000,
    )
  }

  if (!visible) {
    return null
  }

  return (
    <div className="version-update-notification">
      <div className="version-update-notification__content">
        <div className="version-update-notification__icon-wrapper">
          <svg
            className="version-update-notification__update-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
        <div className="version-update-notification__body">
          <h4 className="version-update-notification__title">发现新版本</h4>
          {versionExtraInfoVisible && (
            <>
              <div className="version-update-notification__version-info">
                <div className="version-update-notification__version-title">本地版本</div>
                <div className="version-update-notification__version-details">
                  <div>hash: {visibleInfo.oldBuildHash}</div>
                  <div>构建时间: {visibleInfo.oldBuildTime}</div>
                </div>
              </div>
              <div className="version-update-notification__version-info">
                <div className="version-update-notification__version-title">新版本</div>
                <div className="version-update-notification__version-details">
                  <div>hash: {visibleInfo.newBuildHash}</div>
                  <div>构建时间: {visibleInfo.newBuildTime}</div>
                </div>
              </div>
            </>
          )}
          <p className="version-update-notification__message">
            检测到新版本已发布，建议立即更新以获得最佳体验。
          </p>
          <div className="version-update-notification__actions">
            <button
              className="version-update-notification__button version-update-notification__button--primary"
              onClick={handleUpdate}
            >
              立即更新
            </button>
            <button
              className="version-update-notification__button version-update-notification__button--secondary"
              onClick={handleLater}
            >
              稍后提醒
            </button>
            <button
              className="version-update-notification__button version-update-notification__button--ignore"
              onClick={handleClose}
            >
              忽略
            </button>
          </div>
        </div>
        <button className="version-update-notification__close" onClick={handleClose}>
          <svg
            className="version-update-notification__close-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  )
})

VersionUpdateNotification.displayName = 'VersionUpdateNotification'
