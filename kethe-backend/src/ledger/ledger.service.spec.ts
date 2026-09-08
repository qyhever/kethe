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
})
