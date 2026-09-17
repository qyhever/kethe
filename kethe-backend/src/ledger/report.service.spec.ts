import { ReportService } from './report.service'

describe('ReportService dashboard', () => {
  const dataSource = {} as never
  const recent = { list: [], groups: [] }
  const ledger = { listRecentTransactions: jest.fn().mockResolvedValue(recent) }
  let service: ReportService

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-15T04:00:00.000Z'))
    jest.clearAllMocks()
    service = new ReportService(dataSource, ledger as never)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  async function dashboard(
    current: { income: string; expense: string },
    previous: { income: string; expense: string },
  ) {
    const summary = jest.spyOn(
      service as unknown as {
        summary: () => Promise<{ income: string; expense: string }>
      },
      'summary',
    )
    summary
      .mockResolvedValueOnce(current)
      .mockResolvedValueOnce(previous)
      .mockResolvedValueOnce({ income: '300', expense: '100' })
      .mockResolvedValueOnce({ income: '900', expense: '400' })
    return service.dashboard(14)
  }

  it('返回月度汇总、负结余及跨年上月环比', async () => {
    const result = await dashboard(
      { income: '8000', expense: '10000' },
      { income: '4000', expense: '5000' },
    )

    expect(result.month).toEqual({
      income: '8000',
      expense: '10000',
      balance: '-2000',
      trends: {
        income: { direction: 'up', percentage: 100 },
        expense: { direction: 'up', percentage: 100 },
        balance: { direction: 'down', percentage: 100 },
      },
    })
    const calls = (service as unknown as { summary: jest.Mock }).summary.mock
      .calls as Array<[number, Date, Date]>
    expect(calls[0][1].toISOString()).toBe('2025-12-31T16:00:00.000Z')
    expect(calls[1][1].toISOString()).toBe('2025-11-30T16:00:00.000Z')
  })

  it('首页最近流水只查询最近 10 条', async () => {
    await dashboard(
      { income: '8000', expense: '10000' },
      { income: '4000', expense: '5000' },
    )

    expect(ledger.listRecentTransactions).toHaveBeenCalledWith(14, 10)
  })

  it('计算上涨、下降、持平并保留一位小数', async () => {
    const result = await dashboard(
      { income: '1125', expense: '750' },
      { income: '1000', expense: '1000' },
    )

    expect(result.month.trends.income).toEqual({
      direction: 'up',
      percentage: 12.5,
    })
    expect(result.month.trends.expense).toEqual({
      direction: 'down',
      percentage: 25,
    })
    expect(result.month.trends.balance).toEqual({
      direction: null,
      percentage: null,
    })
  })

  it('金额相同时返回持平', async () => {
    const result = await dashboard(
      { income: '1000', expense: '400' },
      { income: '1000', expense: '400' },
    )

    expect(result.month.trends).toEqual({
      income: { direction: 'flat', percentage: 0 },
      expense: { direction: 'flat', percentage: 0 },
      balance: { direction: 'flat', percentage: 0 },
    })
  })

  it('上月金额为零时返回空环比', async () => {
    const result = await dashboard(
      { income: '500', expense: '0' },
      { income: '0', expense: '0' },
    )

    expect(result.month.trends).toEqual({
      income: { direction: null, percentage: null },
      expense: { direction: null, percentage: null },
      balance: { direction: null, percentage: null },
    })
  })
})

describe('ReportService chart reports', () => {
  function queryBuilder(rows: unknown[]) {
    const qb = {
      select: jest.fn(),
      addSelect: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      innerJoin: jest.fn(),
      leftJoin: jest.fn(),
      groupBy: jest.fn(),
      addGroupBy: jest.fn(),
      orderBy: jest.fn(),
      getRawMany: jest.fn().mockResolvedValue(rows),
    }
    for (const method of [
      'select',
      'addSelect',
      'where',
      'andWhere',
      'innerJoin',
      'leftJoin',
      'groupBy',
      'addGroupBy',
      'orderBy',
    ] as const) {
      qb[method].mockReturnValue(qb)
    }
    return qb
  }

  it('趋势查询附加账户条件并补齐整月点位', async () => {
    const qb = queryBuilder([
      { period: '2026-09-02', expense: '1250', income: '0' },
    ])
    const dataSource = {
      getRepository: () => ({ createQueryBuilder: () => qb }),
    }
    const service = new ReportService(dataSource as never, {} as never)

    const result = await service.trend(14, {
      view: 'month',
      month: '2026-09',
      accountId: '7',
    })

    expect(qb.andWhere).toHaveBeenCalledWith('t.accountId = :accountId', {
      accountId: '7',
    })
    expect(result.points).toHaveLength(30)
    expect(result.points[1]).toEqual({
      period: '2026-09-02',
      expense: '1250',
      income: '0',
    })
  })

  it.each([
    {
      week: '2026-W38',
      first: '2026-09-14',
      last: '2026-09-20',
      start: '2026-09-13T16:00:00.000Z',
      end: '2026-09-20T16:00:00.000Z',
    },
    {
      week: '2020-W01',
      first: '2019-12-30',
      last: '2020-01-05',
      start: '2019-12-29T16:00:00.000Z',
      end: '2020-01-05T16:00:00.000Z',
    },
  ])(
    '周趋势按 ISO 周补齐 7 天：$week',
    async ({ week, first, last, start, end }) => {
      const qb = queryBuilder([
        { period: first, expense: '800', income: '200' },
      ])
      const dataSource = {
        getRepository: () => ({ createQueryBuilder: () => qb }),
      }
      const service = new ReportService(dataSource as never, {} as never)

      const result = await service.trend(14, {
        view: 'week',
        week,
        accountId: '7',
      })

      expect(qb.where).toHaveBeenCalledWith(
        't.userId = :userId AND t.transactionTime >= :start AND t.transactionTime < :end',
        { userId: 14, start: new Date(start), end: new Date(end) },
      )
      expect(qb.andWhere).toHaveBeenCalledWith('t.accountId = :accountId', {
        accountId: '7',
      })
      expect(result.points).toHaveLength(7)
      expect(result.points[0]).toEqual({
        period: first,
        expense: '800',
        income: '200',
      })
      expect(result.points[6]).toEqual({
        period: last,
        expense: '0',
        income: '0',
      })
    },
  )

  it('一级分类返回父分类图标、占比和子分类标记', async () => {
    const qb = queryBuilder([
      {
        categoryId: '10',
        categoryName: '餐饮',
        amount: '7500',
        iconKey: 'food',
        svgContent: '<svg></svg>',
        iconColor: '#3182F6',
        hasChildren: '1',
      },
      {
        categoryId: '20',
        categoryName: '交通',
        amount: '2500',
        iconKey: 'transport',
        svgContent: '<svg></svg>',
        iconColor: '#20B99A',
        hasChildren: '0',
      },
    ])
    const dataSource = {
      getRepository: () => ({ createQueryBuilder: () => qb }),
    }
    const service = new ReportService(dataSource as never, {} as never)

    const result = await service.categories(14, {
      transactionType: 1,
      startTime: '2026-08-31T16:00:00.000Z',
      endTime: '2026-09-30T16:00:00.000Z',
    })

    expect(result.total).toBe('10000')
    expect(result.list[0]).toMatchObject({
      categoryId: '10',
      percentage: 75,
      iconKey: 'food',
      iconColor: '#3182F6',
      hasChildren: true,
    })
  })

  it('二级分类查询附加父分类条件并处理空数据', async () => {
    const qb = queryBuilder([])
    const dataSource = {
      getRepository: () => ({ createQueryBuilder: () => qb }),
    }
    const service = new ReportService(dataSource as never, {} as never)

    const result = await service.categories(14, {
      transactionType: 1,
      startTime: '2026-08-31T16:00:00.000Z',
      endTime: '2026-09-30T16:00:00.000Z',
      parentCategoryId: '10',
    })

    expect(qb.andWhere).toHaveBeenCalledWith('c.parentId = :parentId', {
      parentId: '10',
    })
    expect(result).toEqual({ total: '0', list: [] })
  })
})
