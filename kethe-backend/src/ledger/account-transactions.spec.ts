import type { Server } from 'node:http'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { Account } from '../user/entities/account.entity'
import { AccountTransactionsQueryDto } from './dto/ledger.dto'
import { ReportController } from './report.controllers'
import { ReportService } from './report.service'

function setup(
  accounts: object[] = [],
  outgoing: object[] = [],
  incoming: object[] = [],
) {
  const builder = (rows: object[]) => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rows),
  })
  const out = builder(outgoing)
  const into = builder(incoming)
  const find = jest.fn().mockResolvedValue(accounts)
  const createQueryBuilder = jest
    .fn()
    .mockReturnValueOnce(out)
    .mockReturnValueOnce(into)
  const dataSource = {
    getRepository: jest.fn((entity: unknown) =>
      entity === Account ? { find } : { createQueryBuilder },
    ),
  }
  return {
    service: new ReportService(dataSource as never, {} as never),
    find,
    out,
    into,
  }
}

describe('账户交易笔数聚合', () => {
  it('合并四项、保留停用和零笔账户、保持同笔数账户顺序及大 ID', async () => {
    const { service, find, out, into } = setup(
      [
        {
          id: '9007199254740993',
          name: '停用卡',
          iconKey: 'bank-card',
          isEnabled: false,
        },
        { id: '2', name: '现金', iconKey: 'cash', isEnabled: true },
        { id: '3', name: '零笔', iconKey: null, isEnabled: true },
      ],
      [
        { accountId: '9007199254740993', transactionType: '1', count: '1' },
        { accountId: '9007199254740993', transactionType: '2', count: '1' },
        { accountId: '9007199254740993', transactionType: '3', count: '1' },
        { accountId: '2', transactionType: '1', count: '2' },
        { accountId: 'deleted', transactionType: '1', count: '5' },
      ],
      [{ accountId: '2', transactionType: '3', count: '1' }],
    )
    const report = await service.accountTransactions(14, {
      view: 'month',
      month: '2026-10',
    })
    expect(report.totalCount).toBe(6)
    expect(report.activeAccountCount).toBe(2)
    expect(report.list.map((row) => row.accountId)).toEqual([
      '9007199254740993',
      '2',
      '3',
    ])
    expect(report.list[0]).toMatchObject({
      isEnabled: false,
      expenseCount: 1,
      incomeCount: 1,
      transferOutCount: 1,
      transferInCount: 0,
      totalCount: 3,
    })
    expect(report.list[1].transferInCount).toBe(1)
    expect(report.list[2].totalCount).toBe(0)
    for (const row of report.list)
      expect(row.totalCount).toBe(
        row.expenseCount +
          row.incomeCount +
          row.transferOutCount +
          row.transferInCount,
      )
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 14 },
        order: { sortOrder: 'ASC', id: 'ASC' },
      }),
    )
    for (const qb of [out, into]) {
      expect(qb.where).toHaveBeenCalledWith('t.userId = :userId', {
        userId: 14,
      })
      expect(qb.andWhere).toHaveBeenCalledWith('t.deletedAt IS NULL')
    }
    expect(into.select).toHaveBeenCalledWith('t.targetAccountId', 'accountId')
    expect(into.andWhere).toHaveBeenCalledWith('t.transactionType = 3')
  })
  it('按总笔数降序', async () => {
    const { service } = setup(
      [{ id: '1' }, { id: '2' }],
      [{ accountId: '2', transactionType: 2, count: '2' }],
    )
    expect(
      (
        await service.accountTransactions(14, { view: 'year', year: '2026' })
      ).list.map((row) => row.accountId),
    ).toEqual(['2', '1'])
  })
  it.each([
    [
      { view: 'month', month: '2024-02' },
      '2024-01-31T16:00:00.000Z',
      '2024-02-29T16:00:00.000Z',
    ],
    [
      { view: 'month', month: '2026-12' },
      '2026-11-30T16:00:00.000Z',
      '2026-12-31T16:00:00.000Z',
    ],
    [
      { view: 'year', year: '2024' },
      '2023-12-31T16:00:00.000Z',
      '2024-12-31T16:00:00.000Z',
    ],
  ])('上海时区半开周期 %j', async (query, start, end) => {
    const { service, out, into } = setup()
    expect(
      await service.accountTransactions(
        14,
        query as AccountTransactionsQueryDto,
      ),
    ).toMatchObject({
      ...query,
      list: [],
      totalCount: 0,
      activeAccountCount: 0,
    })
    for (const qb of [out, into])
      expect(qb.andWhere).toHaveBeenCalledWith(
        't.transactionTime >= :start AND t.transactionTime < :end',
        { start: new Date(start), end: new Date(end) },
      )
  })
})

describe('账户笔数 HTTP 接口', () => {
  let app: INestApplication<Server>
  const reports = {
    accountTransactions: jest
      .fn()
      .mockImplementation(
        (userId: number, query: AccountTransactionsQueryDto) =>
          setup().service.accountTransactions(userId, query),
      ),
  }
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [{ provide: ReportService, useValue: reports }],
    }).compile()
    app = module.createNestApplication()
    app.use(
      (req: { user?: { id: number } }, _res: unknown, next: () => void) => {
        req.user = { id: 14 }
        next()
      },
    )
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
    await app.init()
  })
  afterAll(async () => {
    await app.close()
  })
  it.each([
    {},
    { view: 'week' },
    { view: 'month' },
    { view: 'year' },
    { view: 'month', month: '2026-13' },
    { view: 'month', month: '2026-00' },
    { view: 'month', month: '2026-2' },
    { view: 'year', year: '0000' },
    { view: 'year', year: '2026-01' },
  ])('非法参数 %j 返回 400', async (query) => {
    await request(app.getHttpServer())
      .get('/reports/account-transactions')
      .query(query)
      .expect(400)
  })
  it.each([
    { view: 'month', month: '2026-10' },
    { view: 'year', year: '2026' },
  ])('合法周期 %j 使用登录用户并返回空统计', async (query) => {
    await request(app.getHttpServer())
      .get('/reports/account-transactions')
      .query({ ...query, userId: 99 })
      .expect(200)
      .expect({ ...query, totalCount: 0, activeAccountCount: 0, list: [] })
    expect(reports.accountTransactions).toHaveBeenLastCalledWith(
      14,
      expect.objectContaining(query),
    )
  })
})
