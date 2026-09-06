import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import {
  CreateCategoryDto,
  CreateTransactionDto,
  TransactionQueryDto,
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
})
