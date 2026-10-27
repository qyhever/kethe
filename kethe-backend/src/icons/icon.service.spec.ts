import { BadRequestException } from '@nestjs/common'
import type { DataSource, EntityManager } from 'typeorm'
import { IconService, type IconOption } from './icon.service'
import { sanitizeSvg } from './sanitize-svg'

function setup() {
  const items: IconOption[] = [
    {
      id: '9007199254740993',
      scene: 'merchant',
      iconKey: 'new-database-icon',
      iconName: '数据库新增',
      groupKey: 'other',
      svgContent: '<svg viewBox="0 0 24 24"><path d="M1 2h3"/></svg>',
      color: '#123456',
      isEnabled: true,
      isDefault: true,
      sortOrder: 1,
    },
  ]
  const rules = [
    {
      iconKey: 'new-database-icon',
      accountType: 30,
      accountSubType: 0,
      isDefault: true,
    },
  ]
  const query = jest.fn((sql: string, params?: unknown[]) =>
    Promise.resolve(
      sql.includes('FROM account_icon_rules')
        ? rules
        : items.filter(
            (item) =>
              (!params?.[0] || item.scene === params[0]) &&
              (!sql.includes('AND o.isEnabled = 1') || item.isEnabled),
          ),
    ),
  )
  const manager = { query } as unknown as EntityManager
  return {
    items,
    rules,
    query,
    manager,
    service: new IconService({ manager } as DataSource),
  }
}

describe('数据库图标目录', () => {
  it('接受数据库新增 key，按场景隔离并保持 BIGINT 字符串', async () => {
    const { service, query } = setup()
    expect((await service.list('merchant'))[0].id).toBe('9007199254740993')
    await expect(
      service.validate('merchant', 'new-database-icon'),
    ).resolves.toMatchObject({ iconName: '数据库新增' })
    await expect(
      service.validate('member', 'new-database-icon'),
    ).rejects.toBeInstanceOf(BadRequestException)
    await expect(
      service.validate('merchant', 'unknown'),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(query).toHaveBeenCalledWith(expect.any(String), [
      'merchant',
      'merchant',
    ])
  })
  it('停用图标仍可回显和保留，但不可新选', async () => {
    const { service, items } = setup()
    items[0].isEnabled = false
    expect(await service.list('merchant')).toHaveLength(1)
    expect(await service.keys('merchant')).toEqual([])
    await expect(
      service.validate('merchant', items[0].iconKey),
    ).rejects.toBeInstanceOf(BadRequestException)
    await expect(
      service.validate('merchant', items[0].iconKey, items[0].iconKey),
    ).resolves.toBeDefined()
    await expect(service.defaultKey('merchant')).rejects.toBeInstanceOf(
      BadRequestException,
    )
  })
  it('默认规则来自数据库，账户子类型优先，一级类型兜底', async () => {
    const { service, items, rules } = setup()
    items[0].scene = 'account'
    items.push({ ...items[0], id: '2', iconKey: 'subtype-icon' })
    rules.push({
      iconKey: 'subtype-icon',
      accountType: 30,
      accountSubType: 402,
      isDefault: true,
    })
    await expect(service.defaultAccountKey(30, 402)).resolves.toBe(
      'subtype-icon',
    )
    await expect(service.defaultAccountKey(30, 401)).resolves.toBe(
      'new-database-icon',
    )
    await expect(
      service.validateAccount('new-database-icon', 1),
    ).rejects.toBeInstanceOf(BadRequestException)
    await expect(
      service.validateAccount('new-database-icon', 30),
    ).resolves.toBeUndefined()
    items[1].isEnabled = false
    await expect(service.defaultAccountKey(30, 402)).resolves.toBe(
      'new-database-icon',
    )
    await expect(service.defaultAccountKey(1, null)).rejects.toBeInstanceOf(
      BadRequestException,
    )
  })
  it('目录版本稳定，并随 SVG、名称、颜色、排序和停用变化', async () => {
    const { service, items } = setup()
    let previous = (await service.catalog()).version
    expect((await service.catalog()).version).toBe(previous)
    for (const patch of [
      { svgContent: '<svg><circle r="3"/></svg>' },
      { iconName: '新名称' },
      { color: '#ffffff' },
      { sortOrder: 99 },
      { isEnabled: false },
    ]) {
      Object.assign(items[0], patch)
      const next = (await service.catalog()).version
      expect(next).not.toBe(previous)
      previous = next
    }
  })
  it('在指定事务管理器内校验与解析默认图标', async () => {
    const { service, manager, query } = setup()
    await service.validate('merchant', 'new-database-icon', undefined, manager)
    await expect(service.defaultKey('merchant', manager)).resolves.toBe(
      'new-database-icon',
    )
    expect(query).toHaveBeenCalledTimes(2)
  })
})

describe('SVG 清洗', () => {
  it('保留绘图属性，移除脚本、事件、外部资源和内联样式', () => {
    const result = sanitizeSvg(
      '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script><foreignObject><div>bad</div></foreignObject><image href="https://example.com/a"/><path d="M1 2h3" fill="currentColor" style="color:red" onclick="alert(1)"/><circle fill="url(https://example.com/x)" r="3"/></svg>',
    )
    expect(result).toContain('viewBox="0 0 24 24"')
    expect(result).toContain('fill="currentColor"')
    expect(result).not.toMatch(
      /script|onload|onclick|foreignObject|image|https:|style=/,
    )
  })
  it('保留本地渐变引用', () => {
    expect(
      sanitizeSvg(
        '<svg><defs><linearGradient id="gradient"><stop offset="0" stop-color="#fff"/></linearGradient></defs><path fill="url(#gradient)" d="M1 2h3"/></svg>',
      ),
    ).toContain('fill="url(#gradient)"')
  })
})
