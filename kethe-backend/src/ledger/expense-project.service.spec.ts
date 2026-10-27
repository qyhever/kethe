import { createIconServiceMock } from '../icons/testing/icon-service.mock'
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common'
import { DataSource } from 'typeorm'
import { ExpenseProjectService } from './expense-project.service'
import { ExpenseProject } from './entities/expense-project.entity'
function setup() {
  const builder = {
    withDeleted: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
  }
  const item = {
    id: '1',
    userId: 14,
    name: '旅行',
    iconKey: 'folder',
    startDate: null,
    endDate: null,
    isArchived: false,
  }
  const projects = {
    find: jest.fn().mockResolvedValue([item]),
    findOne: jest.fn().mockResolvedValue({ ...item }),
    save: jest
      .fn()
      .mockImplementation((value: object) =>
        Promise.resolve({ ...value, id: '1' }),
      ),
    create: jest.fn().mockImplementation((value: object) => value),
    softRemove: jest.fn().mockResolvedValue(null),
  }
  const transactions = {
    createQueryBuilder: jest.fn().mockReturnValue(builder),
    exists: jest.fn().mockResolvedValue(false),
  }
  const manager = {
    getRepository: jest.fn((entity: unknown) =>
      entity === ExpenseProject ? projects : transactions,
    ),
  }
  const source = {
    ...manager,
    transaction: jest
      .fn()
      .mockImplementation((action: (value: unknown) => Promise<unknown>) =>
        action(manager),
      ),
  }
  return {
    service: new ExpenseProjectService(
      source as unknown as DataSource,
      createIconServiceMock(),
    ),
    projects,
    transactions,
    builder,
  }
}
describe('消费项目管理和统计', () => {
  it('按用户和状态查询，批量汇总保留大金额及已删除流水引用', async () => {
    const { service, projects, builder } = setup()
    builder.getRawMany.mockResolvedValue([
      { id: '1', amount: '9007199254740993123', count: '2', references: '3' },
    ])
    expect(await service.list(14)).toEqual([
      expect.objectContaining({
        expenseAmount: '9007199254740993123',
        transactionCount: 2,
        hasTransactions: true,
      }),
    ])
    expect(projects.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 14, isArchived: false } }),
    )
    expect(builder.withDeleted).toHaveBeenCalled()
    expect(builder.where).toHaveBeenCalledWith('t.userId = :userId', {
      userId: 14,
    })
    await service.list(14, 'archived')
    expect(projects.find).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { userId: 14, isArchived: true } }),
    )
  })
  it('空项目返回零汇总，空列表不查询流水', async () => {
    const { service, projects, transactions } = setup()
    expect((await service.get(14, '1')).expenseAmount).toBe('0')
    projects.find.mockResolvedValue([])
    transactions.createQueryBuilder.mockClear()
    expect(await service.list(14)).toEqual([])
    expect(transactions.createQueryBuilder).not.toHaveBeenCalled()
  })
  it('创建时清理名称，默认图标和日期为空；允许相同名称', async () => {
    const { service, projects } = setup()
    await service.create(14, { name: '  旅行  ' })
    expect(projects.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '旅行',
        iconKey: 'folder',
        startDate: null,
        endDate: null,
        userId: 14,
      }),
    )
    await service.create(14, { name: '旅行' })
    expect(projects.save).toHaveBeenCalledTimes(2)
  })
  it('创建拒绝日期倒置', async () => {
    const { service, projects } = setup()
    await expect(
      service.create(14, {
        name: '旅行',
        startDate: '2026-10-02',
        endDate: '2026-10-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(projects.save).not.toHaveBeenCalled()
  })
  it('编辑合并旧日期后校验，支持清空日期、归档及恢复', async () => {
    const { service, projects } = setup()
    projects.findOne.mockResolvedValue({
      id: '1',
      userId: 14,
      name: '旅行',
      startDate: '2026-10-02',
      endDate: '2026-10-03',
    })
    await expect(
      service.update(14, '1', { endDate: '2026-10-01' }),
    ).rejects.toBeInstanceOf(BadRequestException)
    await service.update(14, '1', {
      startDate: null,
      endDate: null,
      isArchived: true,
    })
    expect(projects.save).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: null,
        endDate: null,
        isArchived: true,
      }),
    )
    await service.update(14, '1', { isArchived: false })
    expect(projects.save).toHaveBeenLastCalledWith(
      expect.objectContaining({ isArchived: false }),
    )
    expect(projects.findOne).toHaveBeenCalledWith({
      where: { userId: 14, id: '1' },
      lock: { mode: 'pessimistic_write' },
    })
  })
  it('删除包含软删除流水的引用检查返回409，无引用才软删除', async () => {
    const { service, projects, transactions } = setup()
    transactions.exists.mockResolvedValue(true)
    await expect(service.remove(14, '1')).rejects.toBeInstanceOf(
      ConflictException,
    )
    expect(projects.softRemove).not.toHaveBeenCalled()
    expect(transactions.exists).toHaveBeenCalledWith({
      where: { userId: 14, expenseProjectId: '1' },
      withDeleted: true,
    })
    transactions.exists.mockResolvedValue(false)
    expect(await service.remove(14, '1')).toBeNull()
    expect(projects.softRemove).toHaveBeenCalled()
  })
  it('不存在或其他用户项目不可读、编辑和删除', async () => {
    const { service, projects } = setup()
    projects.find.mockResolvedValue([])
    projects.findOne.mockResolvedValue(null)
    await expect(service.get(15, '1')).rejects.toBeInstanceOf(NotFoundException)
    await expect(service.update(15, '1', {})).rejects.toBeInstanceOf(
      NotFoundException,
    )
    await expect(service.remove(15, '1')).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })
  it('一级和下钻金额一致，保留直属支出，全部日期及历史分类', async () => {
    const { service, builder } = setup()
    builder.getRawMany.mockResolvedValue([
      {
        id: '10',
        name: '餐饮',
        parentId: null,
        parentName: null,
        amount: '300',
      },
      {
        id: '11',
        name: '早餐',
        parentId: '10',
        parentName: '餐饮',
        amount: '700',
      },
      {
        id: '20',
        name: '交通',
        parentId: null,
        parentName: null,
        amount: '1000',
      },
    ])
    const report = await service.categories(14, '1')
    expect(report.expenseAmount).toBe('2000')
    expect(report.list.find((row) => row.categoryId === '10')).toMatchObject({
      amount: '1000',
      percentage: 50,
    })
    const drill = await service.categories(14, '1', '10')
    expect(drill.expenseAmount).toBe('1000')
    expect(drill.list).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: '未细分',
          amount: '300',
          percentage: 30,
        }),
        expect.objectContaining({
          name: '早餐',
          amount: '700',
          percentage: 70,
        }),
      ]),
    )
    expect(builder.leftJoin).toHaveBeenCalledWith(
      '(SELECT * FROM categories)',
      'c',
      expect.any(String),
    )
    expect(builder.where).toHaveBeenCalledWith(
      't.userId = :userId AND t.expenseProjectId = :id AND t.transactionType = 1',
      { userId: 14, id: '1' },
    )
  })
  it('统计支持超安全整数、零金额、空数据和流水删除后变化', async () => {
    const { service, builder } = setup()
    builder.getRawMany.mockResolvedValue([
      {
        id: '10',
        name: '餐饮',
        parentId: null,
        parentName: null,
        amount: '9007199254740993123',
      },
    ])
    expect((await service.categories(14, '1')).expenseAmount).toBe(
      '9007199254740993123',
    )
    builder.getRawMany.mockResolvedValue([
      { id: '10', name: '餐饮', parentId: null, parentName: null, amount: '0' },
    ])
    expect((await service.categories(14, '1')).list[0].percentage).toBe(0)
    builder.getRawMany.mockResolvedValue([])
    expect(await service.categories(14, '1')).toEqual({
      expenseAmount: '0',
      list: [],
    })
  })
})
