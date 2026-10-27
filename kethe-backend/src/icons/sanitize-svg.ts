import { load } from 'cheerio'

const tags = new Set([
  'svg',
  'g',
  'path',
  'circle',
  'ellipse',
  'rect',
  'line',
  'polyline',
  'polygon',
  'defs',
  'linearGradient',
  'radialGradient',
  'stop',
  'clipPath',
  'title',
  'desc',
])
const attributes = new Set([
  'xmlns',
  'viewBox',
  'width',
  'height',
  'd',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'points',
  'fill',
  'fill-rule',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-opacity',
  'opacity',
  'transform',
  'id',
  'clip-path',
  'clip-rule',
  'offset',
  'stop-color',
  'stop-opacity',
  'gradientUnits',
  'gradientTransform',
  'fx',
  'fy',
])

// 只保留绘图元素；禁用脚本、事件、样式和外部引用。历史 SQL 数据也经过此出口。
export function sanitizeSvg(source: string): string {
  const $ = load(source, { xmlMode: true })
  $('*').each((_index, element) => {
    if (!('attribs' in element)) {
      $(element).remove()
      return
    }
    if (!tags.has(element.name)) {
      $(element).remove()
      return
    }
    for (const [name, value] of Object.entries(element.attribs)) {
      if (
        !attributes.has(name) ||
        /[<>]|javascript:|data:|https?:|\/\//i.test(value) ||
        (/url\s*\(/i.test(value) && !/^url\(#[a-zA-Z0-9_-]+\)$/.test(value))
      )
        $(element).removeAttr(name)
    }
  })
  return $('svg').first().toString()
}
