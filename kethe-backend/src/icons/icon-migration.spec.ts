import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { sanitizeSvg } from './sanitize-svg'

describe('图标迁移种子完整性', () => {
  const migration = readFileSync(
    resolve(__dirname, '../../sql/2026-10-26-unify-business-icons.sql'),
    'utf8',
  ).replace(/\r\n/g, '\n')
  it('全新初始化与升级使用相同图标结构和数据', () => {
    expect(
      readFileSync(resolve(__dirname, '../../sql/init.sql'), 'utf8')
        .replace(/\r\n/g, '\n')
        .endsWith(migration),
    ).toBe(true)
  })
  it('完整导入四类图标，且每个资源都有场景选项', () => {
    const resources = [
      ...migration.matchAll(
        /INSERT IGNORE INTO icon_resources .* VALUES \('([^']+)'/g,
      ),
    ].map((match) => match[1])
    expect(new Set(resources).size).toBe(resources.length)
    for (const [scene, count] of [
      ['account', 12],
      ['member', 9],
      ['expense-project', 8],
      ['merchant', 8],
    ] as const) {
      expect(
        resources.filter((key) => key.startsWith(scene + ':')),
      ).toHaveLength(count)
    }
    for (const resource of resources)
      expect(migration).toContain(`WHERE resourceKey='${resource}'`)
  })
  it('所有内置 SVG 在清洗后保留可见绘图，且使用 viewBox', () => {
    const images = [...migration.matchAll(/'(<svg[\s\S]*?<\/svg>)'/g)].map(
      (match) => match[1].replace(/''/g, "'"),
    )
    expect(images).toHaveLength(54)
    for (const svg of images) {
      const sanitized = sanitizeSvg(svg)
      expect(sanitized).toContain('viewBox=')
      expect(sanitized).toMatch(
        /<(path|rect|circle|ellipse|line|polyline|polygon)\b/,
      )
    }
  })
})
