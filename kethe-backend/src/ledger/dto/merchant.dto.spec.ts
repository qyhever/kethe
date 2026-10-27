import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { CreateMerchantDto, UpdateMerchantDto } from './merchant.dto'
import { CreateTransactionDto, TransactionQueryDto } from './ledger.dto'
describe('商家 DTO', () => {
  it.each(['', '  ', 'a'.repeat(31), null, 123])(
    '拒绝非法名称 %s',
    async (name) => {
      expect(
        await validate(plainToInstance(CreateMerchantDto, { name })),
      ).not.toHaveLength(0)
    },
  )
  it('名称去空白，图标校验格式，编辑不允许空值', async () => {
    const dto = plainToInstance(CreateMerchantDto, {
      name: ' 超市 ',
      iconKey: 'store',
    })
    expect(dto.name).toBe('超市')
    expect(await validate(dto)).toHaveLength(0)
    for (const input of [
      { name: null },
      { iconKey: null },
      { iconKey: 'bad_key' },
    ])
      expect(
        await validate(plainToInstance(UpdateMerchantDto, input)),
      ).not.toHaveLength(0)
    expect(await validate(plainToInstance(UpdateMerchantDto, {}))).toHaveLength(
      0,
    )
  })
  const base = {
    transactionType: 1,
    amount: '100',
    accountId: '1',
    categoryId: '2',
    currency: 'CNY',
    transactionTime: '2026-10-23T00:00:00Z',
  }
  it.each(['0', '-1', '01', 1, 'x'])(
    '流水拒绝非法商家ID %s',
    async (merchantId) => {
      expect(
        await validate(
          plainToInstance(CreateTransactionDto, { ...base, merchantId }),
        ),
      ).not.toHaveLength(0)
    },
  )
  it('流水允许不传或显式清空商家，查询商家多选', async () => {
    for (const merchantId of [undefined, null, '9007199254740993'])
      expect(
        await validate(
          plainToInstance(CreateTransactionDto, { ...base, merchantId }),
        ),
      ).toHaveLength(0)
    expect(
      await validate(
        plainToInstance(TransactionQueryDto, { merchantIds: ['1', '2'] }),
      ),
    ).toHaveLength(0)
    expect(
      await validate(
        plainToInstance(TransactionQueryDto, { merchantIds: ['0'] }),
      ),
    ).not.toHaveLength(0)
  })
})
