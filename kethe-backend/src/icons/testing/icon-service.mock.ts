import { BadRequestException } from '@nestjs/common'
import type { IconScene, IconService } from '../icon.service'

// 领域服务测试只依赖图标服务契约；数据库动态目录由 IconService 测试覆盖。
export function createIconServiceMock(): IconService {
  const keys: Record<IconScene, string[]> = {
    category: ['food', 'other'],
    account: [
      'cash',
      'credit-card',
      'consumer-credit',
      'bank-card',
      'savings',
      'wallet',
      'wechat',
      'alipay',
      'paypal',
      'stored-value-card',
      'voucher',
      'coins',
    ],
    member: [
      'user',
      'woman',
      'man',
      'child',
      'parents',
      'family',
      'heart',
      'baby',
      'friend',
    ],
    merchant: [
      'store',
      'shopping-cart',
      'shopping-bag',
      'package',
      'globe',
      'gift',
      'tags',
      'building',
    ],
    'expense-project': [
      'folder',
      'plane',
      'luggage',
      'house',
      'hammer',
      'heart',
      'gift',
      'shopping-bag',
    ],
  }
  const types = [
    [1],
    [10],
    [10],
    [20],
    [20, 99],
    [30, 99],
    [30],
    [30],
    [30],
    [30],
    [30],
    [99],
  ]
  const validate = jest.fn((scene: IconScene, key: string) => {
    if (!keys[scene].includes(key)) throw new BadRequestException('图标无效')
    return Promise.resolve({ iconKey: key })
  })
  return {
    keys: jest.fn((scene: IconScene) => Promise.resolve(keys[scene])),
    list: jest.fn((scene: IconScene) =>
      Promise.resolve(
        keys[scene].map((iconKey) => ({ iconKey, isEnabled: true })),
      ),
    ),
    validate,
    defaultKey: jest.fn((scene: IconScene) => Promise.resolve(keys[scene][0])),
    accountRules: jest.fn(() =>
      Promise.resolve(
        keys.account.flatMap((iconKey, index) =>
          types[index].map((accountType) => ({ iconKey, accountType })),
        ),
      ),
    ),
    validateAccount: jest.fn(async (key: string, accountType: number) => {
      await validate('account', key)
      if (!types[keys.account.indexOf(key)]?.includes(accountType))
        throw new BadRequestException('图标类型不匹配')
    }),
    defaultAccountKey: jest.fn((type: number, sub: number | null) =>
      Promise.resolve(
        (
          {
            201: 'credit-card',
            202: 'consumer-credit',
            301: 'bank-card',
            302: 'savings',
            402: 'voucher',
            403: 'stored-value-card',
          } as Record<number, string>
        )[sub ?? 0] ??
          (
            {
              1: 'cash',
              10: 'credit-card',
              20: 'bank-card',
              30: 'wallet',
              99: 'coins',
            } as Record<number, string>
          )[type],
      ),
    ),
    accountOptions: jest.fn(() =>
      Promise.resolve([
        { key: 'cash', label: '现金' },
        { key: 'bank-card', label: '银行卡' },
      ]),
    ),
  } as unknown as IconService
}
