import { ReportService } from './report.service'

describe('ReportService dashboard', () => {
  const dataSource = {} as never
  const recent = { list: [], groups: [] }
  const ledger = { listTransactions: jest.fn().mockResolvedValue(recent) }
  let service: ReportService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ReportService(dataSource, ledger as never)
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
    return service.dashboard(14, { month: '2026-01' })
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
