import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import {
  CreateExpenseProjectDto,
  UpdateExpenseProjectDto,
  ExpenseProjectQueryDto,
  ExpenseProjectCategoriesDto,
} from './expense-project.dto'
import { CreateTransactionDto, TransactionQueryDto } from './ledger.dto'
describe('消费项目 DTO', () => {
  it.each(['', '  ', 'a'.repeat(31), null, 123])(
    '拒绝非法名称 %s',
    async (name) => {
      expect(
        await validate(plainToInstance(CreateExpenseProjectDto, { name })),
      ).not.toHaveLength(0)
    },
  )
  it('名称去空白，允许清空日期和备注', async () => {
    const dto = plainToInstance(CreateExpenseProjectDto, {
      name: '  旅行  ',
      startDate: null,
      endDate: null,
      remark: null,
    })
    expect(await validate(dto)).toHaveLength(0)
    expect(dto.name).toBe('旅行')
    expect(
      await validate(
        plainToInstance(UpdateExpenseProjectDto, {
          startDate: null,
          endDate: null,
        }),
      ),
    ).toHaveLength(0)
  })
  it.each([
    { name: null },
    { iconKey: null },
    { iconKey: 'bad' },
    { isArchived: null },
    { isArchived: 'true' },
    { startDate: '2026-02-30' },
    { endDate: '2026-10-01T00:00:00Z' },
    { remark: 'x'.repeat(501) },
  ])('拒绝非法编辑参数 %j', async (input) => {
    expect(
      await validate(plainToInstance(UpdateExpenseProjectDto, input)),
    ).not.toHaveLength(0)
  })
  it('校验状态和分类ID', async () => {
    expect(
      await validate(
        plainToInstance(ExpenseProjectQueryDto, { status: 'all' }),
      ),
    ).toHaveLength(0)
    expect(
      await validate(
        plainToInstance(ExpenseProjectQueryDto, { status: 'bad' }),
      ),
    ).not.toHaveLength(0)
    expect(
      await validate(
        plainToInstance(ExpenseProjectCategoriesDto, { parentCategoryId: '0' }),
      ),
    ).not.toHaveLength(0)
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
    '流水拒绝非法项目ID %s',
    async (expenseProjectId) => {
      expect(
        await validate(
          plainToInstance(CreateTransactionDto, { ...base, expenseProjectId }),
        ),
      ).not.toHaveLength(0)
    },
  )
  it('流水允许不传或显式清空项目，查询项目多选', async () => {
    for (const expenseProjectId of [undefined, null, '9007199254740993'])
      expect(
        await validate(
          plainToInstance(CreateTransactionDto, { ...base, expenseProjectId }),
        ),
      ).toHaveLength(0)
    expect(
      await validate(
        plainToInstance(TransactionQueryDto, { expenseProjectIds: ['1', '2'] }),
      ),
    ).toHaveLength(0)
    expect(
      await validate(
        plainToInstance(TransactionQueryDto, { expenseProjectIds: ['0'] }),
      ),
    ).not.toHaveLength(0)
  })
})
