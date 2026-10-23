import { BadRequestException } from '@nestjs/common'
import { LedgerService } from './ledger.service'
import { CreateTransactionDto } from './dto/ledger.dto'
import { ExpenseProject } from './entities/expense-project.entity'
function setup(item: object | null = { id: '1', isArchived: false }) {
  const findOne = jest.fn().mockResolvedValue(item),
    manager = { getRepository: jest.fn().mockReturnValue({ findOne }) }
  const service = new LedgerService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  ) as unknown as {
    resolveExpenseProject(
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
      service.resolveExpenseProject(manager, 14, dto, previous),
  }
}
describe('流水消费项目关联', () => {
  it('创建不传为空，编辑不传保留，显式null清空', async () => {
    const { resolve, findOne, manager } = setup()
    expect(await resolve({ transactionType: 1 })).toBeNull()
    expect(await resolve({ transactionType: 1 }, '1')).toBe('1')
    expect(
      await resolve({ transactionType: 1, expenseProjectId: null }, '1'),
    ).toBeNull()
    expect(manager.getRepository).toHaveBeenCalledWith(ExpenseProject)
    expect(findOne).toHaveBeenCalledWith({
      where: { id: '1', userId: 14 },
      lock: { mode: 'pessimistic_write' },
    })
  })
  it.each([2, 3])(
    '类型%s拒绝非空项目，改类型自动清空',
    async (transactionType) => {
      const { resolve } = setup()
      await expect(
        resolve({ transactionType, expenseProjectId: '1' }),
      ).rejects.toBeInstanceOf(BadRequestException)
      expect(await resolve({ transactionType }, '1')).toBeNull()
    },
  )
  it('归档项目仅允许保留原关联，禁止新关联或更换为其他归档项目', async () => {
    const { resolve } = setup({ id: '1', isArchived: true })
    expect(
      await resolve({ transactionType: 1, expenseProjectId: '1' }, '1'),
    ).toBe('1')
    await expect(
      resolve({ transactionType: 1, expenseProjectId: '1' }),
    ).rejects.toBeInstanceOf(BadRequestException)
    await expect(
      resolve({ transactionType: 1, expenseProjectId: '1' }, '2'),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(
      await resolve({ transactionType: 1, expenseProjectId: null }, '1'),
    ).toBeNull()
  })
  it('拒绝其他用户、已删除或不存在项目', async () => {
    const { resolve, findOne } = setup(null)
    await expect(
      resolve({ transactionType: 1, expenseProjectId: '1' }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 14, id: '1' } }),
    )
  })
})
