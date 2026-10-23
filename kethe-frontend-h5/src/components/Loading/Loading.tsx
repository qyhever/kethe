import './Loading.css'

export interface LoadingProps {
  text?: string
  variant?: 'page' | 'compact'
  className?: string
}

/** 页面和局部内容共用的加载状态；紧凑模式适用于选择面板、筛选项。 */
export function Loading({
  text = '加载中…',
  variant = 'page',
  className = '',
}: LoadingProps) {
  return (
    <div
      className={`kethe-loading kethe-loading--${variant} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={text || '加载中…'}
    >
      <span className="kethe-loading__indicator" aria-hidden="true" />
      {text && <span className="kethe-loading__text">{text}</span>}
    </div>
  )
}
