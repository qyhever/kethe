import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Transaction, TransactionType } from './entities/transaction.entity'
import { LedgerService } from './ledger.service'

describe('LedgerService 流水视图', () => {
  function createService() {
    return new LedgerService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    )
  }

  it('查询子分类图标并以父分类图标兜底', () => {
    const queryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
    }
    const manager = {
      getRepository: jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      }),
    }

    createService().transactionQuery(manager as never, 14, {} as never)

    expect(queryBuilder.select).toHaveBeenCalledWith(
      expect.arrayContaining([
        'COALESCE(ci.iconKey, pi.iconKey) iconKey',
        'COALESCE(ci.svgContent, pi.svgContent) svgContent',
        'COALESCE(ci.color, pi.color) iconColor',
      ]),
    )
  })

  it('空分类和账户数组不添加筛选条件', () => {
    const queryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
    }
    const manager = {
      getRepository: jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      }),
    }

    createService().transactionQuery(manager as never, 14, {
      categoryIds: [],
      accountIds: [],
    } as never)

    expect(queryBuilder.andWhere).not.toHaveBeenCalled()
  })

  it('转账没有分类与图标时仍正常返回', () => {
    const service = createService() as unknown as {
      transactionView: (row: Record<string, unknown>) => Record<string, unknown>
    }
    const result = service.transactionView({
      id: '1',
      transactionType: 3,
      amount: '8800',
      currency: 'CNY',
      remark: null,
      transactionTime: '2026-09-07T04:00:00.000Z',
      createdAt: '2026-09-07T04:00:00.000Z',
      categoryId: null,
      categoryName: null,
      parentCategoryId: null,
      parentCategoryName: null,
      iconKey: null,
      svgContent: null,
      iconColor: null,
      accountId: '10',
      accountName: '支付宝',
      targetAccountId: '11',
      targetAccountName: '银行卡',
    })

    expect(result).toMatchObject({
      transactionType: 3,
      categoryId: null,
      iconKey: null,
      svgContent: null,
      iconColor: null,
      accountId: '10',
      targetAccountId: '11',
    })
  })

  it('最近流水查询只读取指定数量且不统计总数', async () => {
    const queryBuilder = {
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    }
    const service = createService()
    jest
      .spyOn(service, 'transactionQuery')
      .mockReturnValue(queryBuilder as never)

    await service.listRecentTransactions(14, 10)

    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      't.transactionTime',
      'DESC',
    )
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('t.id', 'DESC')
    expect(queryBuilder.limit).toHaveBeenCalledWith(10)
    expect(queryBuilder.getRawMany).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['38', '3800'],
    ['38.00', '3800'],
    ['38.5', '3850'],
    ['0.05', '5'],
  ])('将金额关键词 %s 从元转换为分', (keyword, expectedAmount) => {
    const queryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
    }
    const manager = {
      getRepository: jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      }),
    }

    createService().transactionQuery(manager as never, 14, {
      keyword,
    } as never)

    expect(queryBuilder.andWhere).toHaveBeenLastCalledWith(
      expect.stringContaining('t.amount = :keywordAmount'),
      { keyword: `%${keyword}%`, keywordAmount: expectedAmount },
    )
  })

  it('查询全部流水并应用筛选条件', async () => {
    const queryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    }
    const summaryQueryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    }
    const manager = {
      getRepository: jest.fn().mockReturnValue({
        createQueryBuilder: jest
          .fn()
          .mockReturnValueOnce(queryBuilder)
          .mockReturnValueOnce(summaryQueryBuilder),
      }),
    }
    const service = new LedgerService(
      { manager } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    )
    const query = {
      currentPage: 3,
      pageSize: 20,
      startTime: '2026-09-01T00:00:00.000Z',
      endTime: '2026-10-01T00:00:00.000Z',
      transactionType: 1,
      categoryIds: ['10', '11'],
      accountIds: ['20', '21'],
      minAmount: '100',
      maxAmount: '5000',
      keyword: '午餐',
    }

    await service.listTransactions(14, query)

    expect(queryBuilder.offset).not.toHaveBeenCalled()
    expect(queryBuilder.limit).not.toHaveBeenCalled()
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      '(t.categoryId IN (:...categoryIds) OR c.parentId IN (:...categoryIds))',
      { categoryIds: query.categoryIds },
    )
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      '(t.accountId IN (:...accountIds) OR t.targetAccountId IN (:...accountIds))',
      { accountIds: query.accountIds },
    )
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      't.transactionType = :transactionType',
      query,
    )
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      't.transactionTime >= :startTime',
      { startTime: new Date(query.startTime) },
    )
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      't.transactionTime < :endTime',
      { endTime: new Date(query.endTime) },
    )
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      't.amount >= :minAmount',
      query,
    )
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      't.amount <= :maxAmount',
      query,
    )
    expect(summaryQueryBuilder.andWhere).toHaveBeenCalledWith(
      '(t.accountId IN (:...accountIds) OR t.targetAccountId IN (:...accountIds))',
      { accountIds: query.accountIds },
    )
    expect(summaryQueryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('t.remark LIKE :keyword'),
      { keyword: '%午餐%', keywordAmount: null },
    )
    expect(summaryQueryBuilder.andWhere).toHaveBeenCalledTimes(
      queryBuilder.andWhere.mock.calls.length,
    )
    expect(summaryQueryBuilder.offset).toBeUndefined()
    expect(summaryQueryBuilder.limit).toBeUndefined()
    expect(summaryQueryBuilder.select).toHaveBeenLastCalledWith(
      expect.arrayContaining([
        expect.stringContaining(
          "CONVERT_TZ(t.transactionTime, '+00:00', '+08:00')",
        ),
        expect.stringContaining(
          'CASE WHEN t.transactionType = 2 THEN t.amount ELSE 0 END',
        ),
        expect.stringContaining(
          'CASE WHEN t.transactionType = 1 THEN t.amount ELSE 0 END',
        ),
      ]),
    )
  })

  it('按年和月汇总收支，转账不计入收支', () => {
    const service = createService() as unknown as {
      transactionSummaries: (
        rows: Array<{
          year: string
          month: string
          income: string
          expense: string
        }>,
      ) => unknown
    }

    expect(
      service.transactionSummaries([
        { year: '2026', month: '2026-12', income: '12000', expense: '2000' },
        { year: '2026', month: '2026-11', income: '0', expense: '3500' },
        { year: '2025', month: '2025-01', income: '800', expense: '0' },
      ]),
    ).toEqual([
      {
        year: '2026',
        income: '12000',
        expense: '5500',
        balance: '6500',
        months: [
          {
            month: '2026-12',
            income: '12000',
            expense: '2000',
            balance: '10000',
          },
          {
            month: '2026-11',
            income: '0',
            expense: '3500',
            balance: '-3500',
          },
        ],
      },
      {
        year: '2025',
        income: '800',
        expense: '0',
        balance: '800',
        months: [
          {
            month: '2025-01',
            income: '800',
            expense: '0',
            balance: '800',
          },
        ],
      },
    ])
  })

  it('无匹配流水时返回空汇总', () => {
    const service = createService() as unknown as {
      transactionSummaries: (rows: never[]) => unknown
    }

    expect(service.transactionSummaries([])).toEqual([])
  })
})

describe('LedgerService 分类设置', () => {
  function setup() {
    const categories = {
      create: jest.fn((value: Record<string, unknown>) => value),
      save: jest.fn((value: Record<string, unknown>) => Promise.resolve(value)),
      findOneBy: jest.fn(),
      existsBy: jest.fn(),
      findBy: jest.fn(),
      softRemove: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
    }
    const icons = {
      existsBy: jest.fn().mockResolvedValue(true),
      find: jest.fn().mockResolvedValue([]),
    }
    const transactions = { existsBy: jest.fn() }
    const service = new LedgerService(
      {} as never,
      categories as never,
      {} as never,
      icons as never,
      transactions as never,
    )
    return { service, categories, icons, transactions }
  }

  it('创建分类时持久化备注并清理空白', async () => {
    const { service, categories } = setup()
    await service.createCategory(14, {
      categoryType: 1,
      name: '  早餐  ',
      remark: '  工作日  ',
      iconId: '1',
    })

    expect(categories.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 14,
        name: '早餐',
        remark: '工作日',
        iconId: '1',
      }),
    )
  })

  it('拒绝把含子分类的一级分类改成子分类', async () => {
    const { service, categories } = setup()
    categories.findOneBy
      .mockResolvedValueOnce({
        id: '10',
        userId: 14,
        categoryType: 1,
        parentId: null,
      })
      .mockResolvedValueOnce({
        id: '20',
        userId: 14,
        categoryType: 1,
        parentId: null,
        isEnabled: true,
      })
    categories.existsBy.mockResolvedValue(true)

    await expect(
      service.updateCategory(14, '10', { parentId: '20' }),
    ).rejects.toThrow('包含子分类的一级分类不能设为子分类')
  })

  it('允许叶子支出分类变更到同类型一级分类并更新备注', async () => {
    const { service, categories } = setup()
    const category = {
      id: '10',
      userId: 14,
      categoryType: 1,
      parentId: null,
      remark: null,
    }
    categories.findOneBy.mockResolvedValueOnce(category).mockResolvedValueOnce({
      id: '20',
      userId: 14,
      categoryType: 1,
      parentId: null,
      isEnabled: true,
    })
    categories.existsBy.mockResolvedValue(false)

    await service.updateCategory(14, '10', {
      parentId: '20',
      remark: '  通勤  ',
    })

    expect(categories.save).toHaveBeenCalledWith(
      expect.objectContaining({ parentId: '20', remark: '通勤' }),
    )
  })

  it('拒绝跨层级排序', async () => {
    const { service, categories } = setup()
    categories.findBy.mockResolvedValue([
      { id: '1', categoryType: 1, parentId: null },
      { id: '2', categoryType: 1, parentId: '1' },
    ])

    await expect(
      service.orderCategories(14, {
        items: [
          { id: '1', sortOrder: 0 },
          { id: '2', sortOrder: 1 },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('保存同级分类排序', async () => {
    const { service, categories } = setup()
    categories.findBy.mockResolvedValue([
      { id: '1', categoryType: 1, parentId: null, sortOrder: 9 },
      { id: '2', categoryType: 1, parentId: null, sortOrder: 8 },
    ])

    await service.orderCategories(14, {
      items: [
        { id: '1', sortOrder: 0 },
        { id: '2', sortOrder: 1 },
      ],
    })

    expect(categories.save).toHaveBeenCalledWith([
      expect.objectContaining({ id: '1', sortOrder: 0 }),
      expect.objectContaining({ id: '2', sortOrder: 1 }),
    ])
  })

  it('未使用的自定义叶子分类执行软删除', async () => {
    const { service, categories, transactions } = setup()
    const category = { id: '1', userId: 14, isSystemDefault: false }
    categories.findOneBy.mockResolvedValue(category)
    transactions.existsBy.mockResolvedValue(false)
    categories.existsBy.mockResolvedValue(false)

    await expect(service.deleteCategory(14, '1')).resolves.toEqual({
      action: 'deleted',
    })
    expect(categories.softRemove).toHaveBeenCalledWith(category)
  })

  it('含子分类的分类执行停用并级联停用子分类', async () => {
    const { service, categories, transactions } = setup()
    const category = {
      id: '1',
      userId: 14,
      isSystemDefault: false,
      isEnabled: true,
    }
    categories.findOneBy.mockResolvedValue(category)
    transactions.existsBy.mockResolvedValue(false)
    categories.existsBy.mockResolvedValue(true)

    await expect(service.deleteCategory(14, '1')).resolves.toEqual({
      action: 'disabled',
    })
    expect(categories.save).toHaveBeenCalledWith(
      expect.objectContaining({ isEnabled: false }),
    )
    expect(categories.update).toHaveBeenCalledWith(
      { parentId: '1', userId: 14 },
      { isEnabled: false },
    )
  })

  it('图标查询保留分组字段', async () => {
    const { service, icons } = setup()
    icons.find.mockResolvedValue([
      { id: '7', iconKey: 'food', groupKey: 'food', isEnabled: true },
    ])

    await expect(service.listIcons()).resolves.toEqual([
      expect.objectContaining({ id: '7', groupKey: 'food' }),
    ])
  })
})

describe('LedgerService 删除流水', () => {
  function setupDelete(transaction: Partial<Transaction> | null) {
    const transactionRepository = {
      findOne: jest.fn().mockResolvedValue(transaction),
      softRemove: jest.fn().mockResolvedValue(transaction),
    }
    const accountIds = transaction
      ? [transaction.accountId, transaction.targetAccountId].filter(
          (id): id is string => !!id,
        )
      : []
    const accountRepository = {
      find: jest.fn().mockImplementation(() =>
        Promise.resolve(
          accountIds.map((id) => ({
            id,
            userId: 14,
            currentBalance: id === '2' ? '5000' : '10000',
          })),
        ),
      ),
      save: jest
        .fn()
        .mockImplementation((accounts) => Promise.resolve(accounts)),
    }
    const manager = {
      getRepository: jest.fn((entity) =>
        entity === Transaction ? transactionRepository : accountRepository,
      ),
    }
    const dataSource = {
      transaction: jest.fn((work: (value: typeof manager) => unknown) =>
        work(manager),
      ),
    }
    const service = new LedgerService(
      dataSource as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    )
    return { service, transactionRepository, accountRepository, manager }
  }

  it.each([
    {
      label: '支出',
      transactionType: TransactionType.EXPENSE,
      targetAccountId: null,
      expectedBalances: ['11000'],
    },
    {
      label: '收入',
      transactionType: TransactionType.INCOME,
      targetAccountId: null,
      expectedBalances: ['9000'],
    },
    {
      label: '转账',
      transactionType: TransactionType.TRANSFER,
      targetAccountId: '2',
      expectedBalances: ['11000', '4000'],
    },
  ])(
    '删除$label流水时回滚账户余额并软删除',
    async ({ transactionType, targetAccountId, expectedBalances }) => {
      const transaction = {
        id: '9',
        userId: 14,
        transactionType,
        amount: '1000',
        accountId: '1',
        targetAccountId,
      }
      const { service, transactionRepository, accountRepository } =
        setupDelete(transaction)

      await expect(service.deleteTransaction(14, '9')).resolves.toBeNull()

      expect(transactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: '9', userId: 14 },
        lock: { mode: 'pessimistic_write' },
      })
      expect(accountRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({ userId: 14 }),
          lock: { mode: 'pessimistic_write' },
        }),
      )
      expect(accountRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining(
          expectedBalances.map((currentBalance) =>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            expect.objectContaining({ currentBalance }),
          ),
        ),
      )
      expect(transactionRepository.softRemove).toHaveBeenCalledWith(transaction)
    },
  )

  it('不存在或不属于当前用户的流水不会调整账户', async () => {
    const { service, transactionRepository, accountRepository } =
      setupDelete(null)

    await expect(service.deleteTransaction(14, '9')).rejects.toBeInstanceOf(
      NotFoundException,
    )

    expect(transactionRepository.findOne).toHaveBeenCalledWith({
      where: { id: '9', userId: 14 },
      lock: { mode: 'pessimistic_write' },
    })
    expect(accountRepository.find).not.toHaveBeenCalled()
    expect(transactionRepository.softRemove).not.toHaveBeenCalled()
  })
})
