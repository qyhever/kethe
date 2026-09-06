import type { EntityManager, Repository } from 'typeorm'
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from './default-user-data.constants'
import { DefaultUserDataService } from './default-user-data.service'
import { Account } from './entities/account.entity'
import { Category } from './entities/category.entity'
import { AccountType } from './enums/account-type.enum'

describe('DefaultUserDataService', () => {
  let service: DefaultUserDataService
  let categoryRecords: Category[]
  let accountRecords: Account[]
  let manager: EntityManager

  beforeEach(() => {
    service = new DefaultUserDataService()
    categoryRecords = []
    accountRecords = []
    let nextCategoryId = 1

    const categoryRepository = {
      create: jest.fn((data: Partial<Category>) => data as Category),
      save: jest.fn((data: Category | Category[]) => {
        const records = Array.isArray(data) ? data : [data]
        for (const record of records) {
          if (!record.id) record.id = String(nextCategoryId++)
          categoryRecords.push(record)
        }
        return Promise.resolve(data)
      }),
      findOne: jest.fn().mockResolvedValue(null),
      find: jest.fn().mockResolvedValue([]),
      manager: { query: jest.fn().mockResolvedValue([]) },
    } as unknown as Repository<Category>
    const accountRepository = {
      create: jest.fn((data: Partial<Account>) => data as Account),
      save: jest.fn((data: Account | Account[]) => {
        accountRecords.push(...(Array.isArray(data) ? data : [data]))
        return Promise.resolve(data)
      }),
      find: jest.fn().mockResolvedValue([]),
    } as unknown as Repository<Account>

    manager = {
      getRepository: jest.fn((entity: typeof Category | typeof Account) =>
        entity === Category ? categoryRepository : accountRepository,
      ),
    } as unknown as EntityManager
  })

  it('应该按定义顺序创建 73 条默认分类并建立父子关系', async () => {
    await service.initialize(42, manager)

    expect(DEFAULT_EXPENSE_CATEGORIES).toHaveLength(12)
    expect(
      DEFAULT_EXPENSE_CATEGORIES.reduce(
        (total, category) => total + category.children.length,
        0,
      ),
    ).toBe(55)
    expect(DEFAULT_INCOME_CATEGORIES).toHaveLength(6)
    expect(categoryRecords).toHaveLength(73)

    const expenseParents = categoryRecords.filter(
      (category) => category.categoryType === 1 && category.parentId === null,
    )
    const expenseChildren = categoryRecords.filter(
      (category) => category.categoryType === 1 && category.parentId !== null,
    )
    const incomeCategories = categoryRecords.filter(
      (category) => category.categoryType === 2,
    )

    expect(expenseParents.map(({ name }) => name)).toEqual(
      DEFAULT_EXPENSE_CATEGORIES.map(({ name }) => name),
    )
    expect(expenseParents.map(({ sortOrder }) => sortOrder)).toEqual(
      Array.from({ length: 12 }, (_, index) => index + 1),
    )
    expect(expenseChildren).toHaveLength(55)
    expect(incomeCategories.map(({ name }) => name)).toEqual(
      DEFAULT_INCOME_CATEGORIES.map(({ name }) => name),
    )
    expect(incomeCategories.every(({ parentId }) => parentId === null)).toBe(
      true,
    )

    for (const [index, definition] of DEFAULT_EXPENSE_CATEGORIES.entries()) {
      const parent = expenseParents[index]
      const children = expenseChildren.filter(
        (category) => category.parentId === parent.id,
      )
      expect(children.map(({ name }) => name)).toEqual(
        definition.children.map(({ name }) => name),
      )
      expect(children.map(({ sortOrder }) => sortOrder)).toEqual(
        definition.children.map((_, childIndex) => childIndex + 1),
      )
    }

    expect(
      categoryRecords.every(
        (category) =>
          category.userId === 42 &&
          category.iconId === null &&
          category.isSystemDefault &&
          category.isEnabled,
      ),
    ).toBe(true)
    expect(
      new Set(categoryRecords.map(({ systemKey }) => systemKey)).size,
    ).toBe(73)
  })

  it('应该按顺序创建五个零余额人民币默认账户', async () => {
    await service.initialize(42, manager)

    expect(accountRecords).toHaveLength(5)
    expect(accountRecords.map(({ name }) => name)).toEqual([
      '现金',
      '银行卡',
      'PayPal',
      '微信',
      '支付宝',
    ])
    expect(accountRecords.map(({ accountType }) => accountType)).toEqual([
      AccountType.CASH,
      AccountType.BANK_CARD,
      AccountType.PAYPAL,
      AccountType.WECHAT,
      AccountType.ALIPAY,
    ])
    expect(accountRecords.map(({ systemKey }) => systemKey)).toEqual(
      DEFAULT_ACCOUNTS.map(({ systemKey }) => systemKey),
    )
    expect(accountRecords.map(({ sortOrder }) => sortOrder)).toEqual([
      1, 2, 3, 4, 5,
    ])
    expect(
      accountRecords.every(
        (account) =>
          account.userId === 42 &&
          account.icon === null &&
          account.currency === 'CNY' &&
          account.initialBalance === '0' &&
          account.currentBalance === '0' &&
          account.includeInAssets &&
          account.isSystemDefault &&
          account.isEnabled &&
          account.remark === null,
      ),
    ).toBe(true)
  })
})
