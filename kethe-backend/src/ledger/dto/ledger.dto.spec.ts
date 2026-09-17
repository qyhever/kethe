import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import {
  CreateCategoryDto,
  CreateTransactionDto,
  TransactionQueryDto,
  TrendQueryDto,
} from './ledger.dto'

describe('记账 DTO', () => {
  const validExpense = {
    transactionType: 1,
    amount: '3800',
    categoryId: '1',
    accountId: '2',
    currency: 'CNY',
    transactionTime: '2026-09-06T04:00:00.000Z',
  }

  it.each(['0', '-1', '1.5', '01', 'abc'])(
    '拒绝非法流水金额 %s',
    async (amount) => {
      const dto = plainToInstance(CreateTransactionDto, {
        ...validExpense,
        amount,
      })
      expect(await validate(dto)).not.toHaveLength(0)
    },
  )

  it('接受正整数最小货币单位金额', async () => {
    const dto = plainToInstance(CreateTransactionDto, validExpense)
    expect(await validate(dto)).toHaveLength(0)
  })

  it('拒绝非法时间和币种', async () => {
    const dto = plainToInstance(CreateTransactionDto, {
      ...validExpense,
      currency: 'USD',
      transactionTime: 'not-a-date',
    })
    expect(await validate(dto)).toHaveLength(2)
  })

  it('限制分页大小不超过 100', async () => {
    const dto = plainToInstance(TransactionQueryDto, { pageSize: '101' })
    expect(await validate(dto)).not.toHaveLength(0)
  })

  it('接受合法的多分类、多账户和空数组筛选', async () => {
    const multiple = plainToInstance(TransactionQueryDto, {
      categoryIds: ['1', '9007199254740993'],
      accountIds: ['2', '3'],
    })
    const empty = plainToInstance(TransactionQueryDto, {
      categoryIds: [],
      accountIds: [],
    })

    expect(await validate(multiple)).toHaveLength(0)
    expect(await validate(empty)).toHaveLength(0)
  })

  it.each([
    { categoryIds: '1' },
    { categoryIds: [''] },
    { categoryIds: ['0'] },
    { categoryIds: ['-1'] },
    { categoryIds: ['1.5'] },
    { accountIds: '2' },
    { accountIds: ['abc'] },
  ])('拒绝非法的多选 ID：%j', async (input) => {
    const dto = plainToInstance(TransactionQueryDto, input)
    expect(await validate(dto)).not.toHaveLength(0)
  })

  it.each([{ categoryId: '1' }, { accountId: '2' }])(
    '拒绝旧版单值查询字段：%j',
    async (input) => {
      const dto = plainToInstance(TransactionQueryDto, input)
      expect(
        await validate(dto, {
          whitelist: true,
          forbidNonWhitelisted: true,
        }),
      ).not.toHaveLength(0)
    },
  )

  it('分类 ID 必须是十进制正整数字符串', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      categoryType: 1,
      parentId: '9007199254740993',
      name: '自定义分类',
    })
    expect(await validate(dto)).toHaveLength(0)
    dto.parentId = '0'
    expect(await validate(dto)).not.toHaveLength(0)
  })

  it.each(['1', '9007199254740993'])(
    '趋势筛选接受合法账户 ID %s',
    async (accountId) => {
      const dto = plainToInstance(TrendQueryDto, {
        view: 'month',
        month: '2026-09',
        accountId,
      })
      expect(await validate(dto)).toHaveLength(0)
    },
  )

  it.each(['0', '-1', '1.5', 'abc'])(
    '趋势筛选拒绝非法账户 ID %s',
    async (accountId) => {
      const dto = plainToInstance(TrendQueryDto, {
        view: 'month',
        month: '2026-09',
        accountId,
      })
      expect(await validate(dto)).not.toHaveLength(0)
    },
  )

  it.each(['2026-W01', '2020-W53', '2025-W52'])(
    '趋势筛选接受合法 ISO 周 %s',
    async (week) => {
      const dto = plainToInstance(TrendQueryDto, { view: 'week', week })
      expect(await validate(dto)).toHaveLength(0)
    },
  )

  it.each([
    '2026-01',
    '2026-W1',
    '2026-W00',
    '2026-W54',
    '2021-W53',
    'abcd-W01',
  ])('趋势筛选拒绝非法 ISO 周 %s', async (week) => {
    const dto = plainToInstance(TrendQueryDto, { view: 'week', week })
    expect(await validate(dto)).not.toHaveLength(0)
  })
})
