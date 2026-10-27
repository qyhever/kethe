import { createIconServiceMock } from '../icons/testing/icon-service.mock'
import { LedgerService } from './ledger.service'
import { Merchant } from './entities/merchant.entity'
import { Transaction } from './entities/transaction.entity'
import { Account } from '../user/entities/account.entity'
import { Category } from '../user/entities/category.entity'
import { CreateTransactionDto } from './dto/ledger.dto'

describe('商家关联流水保存与响应', () => {
  it('新增回显，更新省略保留，null清空，切换收入清空且余额正确', async () => {
    let saved: Transaction
    const merchant = {
      id: '9007199254740993',
      userId: 42,
      name: '超市',
      iconKey: 'store',
    }
    const account = {
      id: '1',
      userId: 42,
      isEnabled: true,
      currency: 'CNY',
      currentBalance: '10000',
    }
    const qb = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(() =>
        Promise.resolve({
          ...saved,
          merchantName: saved.merchantId ? merchant.name : null,
          merchantIconKey: saved.merchantId ? merchant.iconKey : null,
          parentCategoryId: null,
        }),
      ),
    }
    const transactions = {
      create: jest.fn(
        (data: Partial<Transaction>) =>
          ({
            ...data,
            id: '100',
            createdAt: new Date(),
            deletedAt: null,
          }) as Transaction,
      ),
      save: jest.fn((data: Transaction) => {
        saved = data
        return Promise.resolve(data)
      }),
      findOne: jest.fn(() => Promise.resolve(saved)),
      createQueryBuilder: jest.fn(() => qb),
    }
    const accounts = {
      find: jest.fn().mockResolvedValue([account]),
      save: jest.fn().mockResolvedValue([account]),
    }
    const merchants = { findOne: jest.fn().mockResolvedValue(merchant) }
    const categories = {
      findOneBy: jest.fn().mockImplementation(({ id }: { id: string }) =>
        Promise.resolve({
          id,
          categoryType: id === '2' ? 2 : 1,
          isEnabled: true,
        }),
      ),
    }
    const manager = {
      getRepository: jest.fn((target: unknown) => {
        if (target === Transaction) return transactions
        if (target === Account) return accounts
        if (target === Merchant) return merchants
        if (target === Category) return categories
        throw new Error('unexpected repository')
      }),
    }
    const source = {
      manager,
      transaction: (callback: (value: typeof manager) => unknown) =>
        callback(manager),
    }
    const service = new LedgerService(
      source as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      createIconServiceMock(),
    )
    const dto: CreateTransactionDto = {
      transactionType: 1,
      amount: '500',
      categoryId: '3',
      accountId: '1',
      currency: 'CNY',
      transactionTime: '2026-10-26T04:00:00Z',
    }
    expect(
      await service.createTransaction(42, { ...dto, merchantId: merchant.id }),
    ).toMatchObject({
      merchantId: merchant.id,
      merchantName: '超市',
      merchantIconKey: 'store',
    })
    expect(account.currentBalance).toBe('9500')
    expect(await service.updateTransaction(42, '100', dto)).toMatchObject({
      merchantId: merchant.id,
    })
    expect(account.currentBalance).toBe('9500')
    expect(
      await service.updateTransaction(42, '100', { ...dto, merchantId: null }),
    ).toMatchObject({
      merchantId: null,
      merchantName: null,
      merchantIconKey: null,
    })
    await service.updateTransaction(42, '100', {
      ...dto,
      merchantId: merchant.id,
    })
    expect(
      await service.updateTransaction(42, '100', {
        ...dto,
        transactionType: 2,
        categoryId: '2',
      }),
    ).toMatchObject({ merchantId: null })
    expect(account.currentBalance).toBe('10500')
  })
})
