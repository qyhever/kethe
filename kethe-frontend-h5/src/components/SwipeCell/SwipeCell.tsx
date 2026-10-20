import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import './SwipeCell.css'

export interface SwipeCellProps {
  children: ReactNode
  actions: ReactNode
  actionWidth: number
  open: boolean
  disabled?: boolean
  onOpenChange: (open: boolean) => void
}

const DIRECTION_LOCK_DISTANCE = 7
const OPEN_THRESHOLD_RATIO = 0.35

export function SwipeCell({
  children,
  actions,
  actionWidth,
  open,
  disabled = false,
  onOpenChange,
}: SwipeCellProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const gestureRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    startOffset: number
    axis: 'pending' | 'horizontal' | 'vertical'
    dragged: boolean
    captureTarget: Element
  } | null>(null)
  const suppressClickRef = useRef(false)
  const [dragOffset, setDragOffset] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    const closeFromOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false)
    }
    document.addEventListener('pointerdown', closeFromOutside)
    return () => document.removeEventListener('pointerdown', closeFromOutside)
  }, [onOpenChange, open])

  const settleGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return
    gestureRef.current = null
    if (gesture.captureTarget.hasPointerCapture(event.pointerId)) {
      gesture.captureTarget.releasePointerCapture(event.pointerId)
    }
    if (gesture.axis === 'horizontal') {
      const offset = dragOffset ?? gesture.startOffset
      onOpenChange(offset <= -actionWidth * OPEN_THRESHOLD_RATIO)
      suppressClickRef.current = gesture.dragged
      window.setTimeout(() => {
        suppressClickRef.current = false
      })
    }
    setDragOffset(null)
  }

  const offset = disabled ? 0 : (dragOffset ?? (open ? -actionWidth : 0))

  return (
    <div
      className={`swipe-cell${dragOffset !== null ? ' swipe-cell--dragging' : ''}`}
      ref={rootRef}
      style={
        { '--swipe-action-width': `${actionWidth}px` } as React.CSSProperties
      }
    >
      <div
        className="swipe-cell__content"
        style={{ transform: `translate3d(${offset}px, 0, 0)` }}
        onPointerDown={(event) => {
          if (disabled || event.button !== 0) return
          // 保持原点击目标，同时捕获快速移出行区域的拖动。
          const captureTarget = event.target as Element
          gestureRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startOffset: open ? -actionWidth : 0,
            axis: 'pending',
            dragged: false,
            captureTarget,
          }
          captureTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          const gesture = gestureRef.current
          if (!gesture || gesture.pointerId !== event.pointerId) return
          const deltaX = event.clientX - gesture.startX
          const deltaY = event.clientY - gesture.startY
          if (gesture.axis === 'pending') {
            if (
              Math.abs(deltaX) < DIRECTION_LOCK_DISTANCE &&
              Math.abs(deltaY) < DIRECTION_LOCK_DISTANCE
            ) {
              return
            }
            gesture.axis =
              Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical'
            if (gesture.axis === 'vertical') {
              gestureRef.current = null
              gesture.captureTarget.releasePointerCapture(event.pointerId)
              return
            }
          }
          if (gesture.axis !== 'horizontal') return
          event.preventDefault()
          gesture.dragged = gesture.dragged || Math.abs(deltaX) > 10
          const next = Math.max(
            -actionWidth,
            Math.min(0, gesture.startOffset + deltaX),
          )
          setDragOffset(next)
        }}
        onPointerUp={settleGesture}
        onPointerCancel={settleGesture}
        onClickCapture={(event) => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false
            event.preventDefault()
            event.stopPropagation()
            return
          }
          if (open) {
            onOpenChange(false)
            event.preventDefault()
            event.stopPropagation()
          }
        }}
      >
        {children}
      </div>
      <div
        className="swipe-cell__actions"
        aria-hidden={!open}
        // Closed actions must not be reachable through the keyboard behind the row.
        inert={!open ? true : undefined}
      >
        {actions}
      </div>
    </div>
  )
}
