import { BadRequestException } from '@nestjs/common'
import { LedgerService } from './ledger.service'
import { CreateTransactionDto } from './dto/ledger.dto'
import { Merchant } from './entities/merchant.entity'
function setup(item: object | null = { id: '1' }) {
  const findOne = jest.fn().mockResolvedValue(item),
    manager = { getRepository: jest.fn().mockReturnValue({ findOne }) }
  const service = new LedgerService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  ) as unknown as {
    resolveMerchant(
      manager: unknown,
      userId: number,
      dto: Partial<CreateTransactionDto>,
      previous?: string | null,
    ): Promise<string | null>
  }
  return {
    findOne,
    manager,
    resolve: (dto: Partial<CreateTransactionDto>, previous?: string | null) =>
      service.resolveMerchant(manager, 14, dto, previous),
  }
}
describe('流水商家关联', () => {
  it('创建不传为空，编辑不传保留，显式null清空', async () => {
    const { resolve, findOne, manager } = setup()
    expect(await resolve({ transactionType: 1 })).toBeNull()
    expect(await resolve({ transactionType: 1 }, '1')).toBe('1')
    expect(
      await resolve({ transactionType: 1, merchantId: null }, '1'),
    ).toBeNull()
    expect(manager.getRepository).toHaveBeenCalledWith(Merchant)
    expect(findOne).toHaveBeenCalledWith({
      where: { id: '1', userId: 14 },
      lock: { mode: 'pessimistic_write' },
    })
  })
  it.each([2, 3])(
    '类型%s拒绝非空商家，改类型自动清空',
    async (transactionType) => {
      const { resolve } = setup()
      await expect(
        resolve({ transactionType, merchantId: '1' }),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(await resolve({ transactionType }, '1')).toBeNull()
    },
  )
  it('拒绝其他用户或不存在商家', async () => {
    const { resolve, findOne } = setup(null)
    await expect(
      resolve({ transactionType: 1, merchantId: '1' }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 14, id: '1' } }),
    )
  })
})
