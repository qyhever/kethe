import { useMemo } from 'react'
import type { IconScene } from '../api/icons'
import { useIconStore } from '../stores/icons'

const tags = new Set(['svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'defs', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'title', 'desc'])
const attributes = new Set(['xmlns', 'viewBox', 'width', 'height', 'd', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'points', 'fill', 'fill-rule', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-opacity', 'opacity', 'transform', 'id', 'clip-path', 'clip-rule', 'offset', 'stop-color', 'stop-opacity', 'gradientUnits', 'gradientTransform', 'fx', 'fy'])
const fallback = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M9 12h6"/></svg>'

function safeSvg(source: string, size: number) {
  const document = new DOMParser().parseFromString(source, 'image/svg+xml')
  if (document.querySelector('parsererror') || document.documentElement.localName !== 'svg') return safeSvg(fallback, size)
  for (const element of Array.from(document.querySelectorAll('*'))) {
    if (!tags.has(element.localName)) { element.remove(); continue }
    for (const attribute of Array.from(element.attributes)) {
      if (!attributes.has(attribute.name) || /[<>]|javascript:|data:|https?:|\/\//i.test(attribute.value) || (/url\s*\(/i.test(attribute.value) && !/^url\(#[a-zA-Z0-9_-]+\)$/.test(attribute.value))) element.removeAttribute(attribute.name)
    }
  }
  const root = document.documentElement
  if (!root.hasAttribute('fill')) root.setAttribute('fill', 'currentColor')
  root.setAttribute('width', String(size))
  root.setAttribute('height', String(size))
  root.setAttribute('aria-hidden', 'true')
  root.setAttribute('focusable', 'false')
  return root.outerHTML
}

export function BusinessIcon({ scene, iconKey, svgContent, size = 24, color, className }: {
  scene: IconScene; iconKey?: string | null; svgContent?: string | null; size?: number; color?: string; className?: string
}) {
  const item = useIconStore(state => state.items.find(item => item.scene === scene && item.iconKey === iconKey))
  const source = item?.svgContent || svgContent || fallback
  const html = useMemo(() => safeSvg(source, size), [source, size])
  return <span className={className} style={{ display: 'inline-flex', width: size, height: size, flexShrink: 0, color: color ?? item?.color ?? undefined }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
}
