import type { EntityManager, Repository } from 'typeorm'
import {
  DEFAULT_ACCOUNTS,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from './default-user-data.constants'
import { DefaultUserDataService } from './default-user-data.service'
import { Member } from './entities/member.entity'
import { Account } from './entities/account.entity'
import { Category } from './entities/category.entity'
import {
  AccountNature,
  AccountSubType,
  AccountType,
} from './enums/account-type.enum'

describe('DefaultUserDataService', () => {
  let service: DefaultUserDataService
  let categoryRecords: Category[]
  let accountRecords: Account[]
  let memberRecords: Member[]
  let manager: EntityManager
  let iconIdByKey: Map<string, string>

  beforeEach(() => {
    service = new DefaultUserDataService()
    categoryRecords = []
    accountRecords = []
    memberRecords = []
    let nextCategoryId = 1
    iconIdByKey = new Map<string, string>()
    const resolveIconId = (iconKey: string) => {
      let id = iconIdByKey.get(iconKey)
      if (!id) {
        id = String(iconIdByKey.size + 1)
        iconIdByKey.set(iconKey, id)
      }
      return id
    }

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
      manager: {
        query: jest.fn((_sql: string, parameters: [string]) =>
          Promise.resolve([{ id: resolveIconId(parameters[0]) }]),
        ),
      },
    } as unknown as Repository<Category>
    const accountRepository = {
      create: jest.fn((data: Partial<Account>) => data as Account),
      save: jest.fn((data: Account | Account[]) => {
        accountRecords.push(...(Array.isArray(data) ? data : [data]))
        return Promise.resolve(data)
      }),
      find: jest.fn().mockResolvedValue([]),
    } as unknown as Repository<Account>

    const memberRepository = {
      find: jest.fn(() => Promise.resolve([...memberRecords])),
      create: jest.fn((data: Partial<Member>) => data as Member),
      save: jest.fn((data: Member[]) => {
        memberRecords.push(...data)
        return Promise.resolve(data)
      }),
    }
    manager = {
      getRepository: jest.fn(
        (entity: typeof Category | typeof Account | typeof Member) =>
          entity === Member
            ? memberRepository
            : entity === Category
              ? categoryRepository
              : accountRepository,
      ),
    } as unknown as EntityManager
  })

  it('应该按定义顺序创建 86 条默认分类并建立父子关系', async () => {
    await service.initialize(42, manager)

    expect(DEFAULT_EXPENSE_CATEGORIES).toHaveLength(13)
    expect(
      DEFAULT_EXPENSE_CATEGORIES.reduce(
        (total, category) => total + category.children.length,
        0,
      ),
    ).toBe(67)
    expect(DEFAULT_INCOME_CATEGORIES).toHaveLength(6)
    expect(categoryRecords).toHaveLength(86)

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
      Array.from({ length: 13 }, (_, index) => index + 1),
    )
    expect(expenseChildren).toHaveLength(67)
    const transport = expenseParents.find(
      ({ systemKey }) => systemKey === 'expense_transport',
    )
    expect(
      expenseChildren
        .filter(({ parentId }) => parentId === transport?.id)
        .map(({ name }) => name),
    ).toEqual([
      '公交',
      '地铁',
      '打车',
      '火车',
      '飞机',
      '私家车',
      '加油',
      '充电',
      '停车',
      '过路费',
      '租车',
      '游轮',
    ])
    expect(incomeCategories.map(({ name }) => name)).toEqual(
      DEFAULT_INCOME_CATEGORIES.map(({ name }) => name),
    )
    expect(incomeCategories.every(({ parentId }) => parentId === null)).toBe(
      true,
    )
    expect(incomeCategories.map(({ iconId }) => iconId)).toEqual(
      DEFAULT_INCOME_CATEGORIES.map(({ iconKey }) => iconIdByKey.get(iconKey)),
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
          category.isSystemDefault &&
          category.isEnabled,
      ),
    ).toBe(true)
    expect(expenseParents.every(({ iconId }) => iconId !== null)).toBe(true)
    for (const definition of DEFAULT_EXPENSE_CATEGORIES) {
      for (const child of definition.children) {
        expect(
          expenseChildren.find(({ systemKey }) => systemKey === child.systemKey)
            ?.iconId,
        ).toBe(iconIdByKey.get(child.iconKey))
        expect(child.iconKey).not.toBe(
          definition.systemKey.replace('expense_', ''),
        )
      }
    }
    expect(
      new Set(categoryRecords.map(({ systemKey }) => systemKey)).size,
    ).toBe(86)
  })

  it('创建景点门票、纪念品和住宿分类并使用专属图标', async () => {
    await service.initialize(42, manager)

    const accommodation = categoryRecords.find(
      ({ systemKey }) => systemKey === 'expense_accommodation',
    )!
    expect(accommodation).toMatchObject({
      name: '住宿',
      parentId: null,
      categoryType: 1,
      iconId: iconIdByKey.get('accommodation'),
    })
    expect(
      categoryRecords
        .filter(({ parentId }) => parentId === accommodation.id)
        .map(({ name }) => name),
    ).toEqual(['酒店', '民宿', '其它住宿'])

    for (const [systemKey, name, parentKey, iconKey] of [
      [
        'expense_entertainment_attraction_tickets',
        '景点门票',
        'expense_entertainment',
        'attraction-ticket',
      ],
      ['expense_shopping_souvenir', '纪念品', 'expense_shopping', 'souvenir'],
      ['expense_accommodation_hotel', '酒店', 'expense_accommodation', 'hotel'],
      [
        'expense_accommodation_homestay',
        '民宿',
        'expense_accommodation',
        'homestay',
      ],
      [
        'expense_accommodation_other',
        '其它住宿',
        'expense_accommodation',
        'accommodation-other',
      ],
    ]) {
      const parent = categoryRecords.find(
        (item) => item.systemKey === parentKey,
      )!
      expect(
        categoryRecords.find((item) => item.systemKey === systemKey),
      ).toMatchObject({
        name,
        categoryType: 1,
        parentId: parent.id,
        iconId: iconIdByKey.get(iconKey),
      })
    }
  })

  it('为旧用户补齐新增分类，重复初始化保留修改及软删除状态', async () => {
    await service.initialize(42, manager)
    categoryRecords = categoryRecords.filter(
      ({ systemKey }) =>
        !systemKey?.startsWith('expense_accommodation') &&
        systemKey !== 'expense_entertainment_attraction_tickets',
    )
    const souvenir = categoryRecords.find(
      ({ systemKey }) => systemKey === 'expense_shopping_souvenir',
    )!
    const deletedAt = new Date()
    Object.assign(souvenir, {
      name: '旅行纪念',
      iconId: 'custom-icon',
      isEnabled: false,
      deletedAt,
      sortOrder: 99,
    })

    const repository = manager.getRepository(Category)
    jest.spyOn(repository, 'findOne').mockImplementation((options) => {
      const where = options.where as Partial<Category>
      return Promise.resolve(
        categoryRecords.find(
          (item) =>
            item.userId === where.userId && item.systemKey === where.systemKey,
        ) ?? null,
      )
    })
    jest.spyOn(repository, 'find').mockImplementation((options) => {
      const where = options?.where as Partial<Category>
      return Promise.resolve(
        categoryRecords.filter((item) =>
          Object.entries(where).every(
            ([key, value]) => item[key as keyof Category] === value,
          ),
        ),
      )
    })

    await service.initialize(42, manager)
    await service.initialize(42, manager)

    expect(categoryRecords).toHaveLength(86)
    expect(
      new Set(categoryRecords.map(({ systemKey }) => systemKey)).size,
    ).toBe(86)
    expect(souvenir).toMatchObject({
      name: '旅行纪念',
      iconId: 'custom-icon',
      isEnabled: false,
      deletedAt,
      sortOrder: 99,
    })
    const accommodation = categoryRecords.find(
      ({ systemKey }) => systemKey === 'expense_accommodation',
    )!
    expect(
      categoryRecords.filter(({ parentId }) => parentId === accommodation.id),
    ).toHaveLength(3)
  })

  it('创建六个默认成员，重复初始化保留名称修改和软删除状态', async () => {
    await service.initialize(42, manager)
    expect(memberRecords.map((item) => item.name)).toEqual([
      '本人',
      '老婆',
      '老公',
      '子女',
      '父母',
      '家庭共用',
    ])
    expect(memberRecords.map((item) => item.sortOrder)).toEqual([
      1, 2, 3, 4, 5, 6,
    ])
    memberRecords[0].name = '自己'
    memberRecords[1].deletedAt = new Date()
    await service.initialize(42, manager)
    expect(memberRecords).toHaveLength(6)
    expect(memberRecords[0].name).toBe('自己')
    expect(memberRecords[1].deletedAt).toBeInstanceOf(Date)
  })

  it('应该按顺序创建五个零余额人民币默认账户', async () => {
    await service.initialize(42, manager)

    expect(accountRecords).toHaveLength(5)
    expect(accountRecords.map(({ name }) => name)).toEqual([
      '现金',
      '储蓄卡',
      'PayPal',
      '微信',
      '支付宝',
    ])
    expect(accountRecords.map(({ accountType }) => accountType)).toEqual([
      AccountType.CASH,
      AccountType.DEBIT,
      AccountType.VIRTUAL,
      AccountType.VIRTUAL,
      AccountType.VIRTUAL,
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
          typeof account.iconKey === 'string' &&
          account.currency === 'CNY' &&
          account.initialBalance === '0' &&
          account.currentBalance === '0' &&
          account.includeInNetWorth &&
          account.isSystemDefault &&
          account.isEnabled &&
          account.remark === null,
      ),
    ).toBe(true)
    expect(accountRecords.map(({ accountNature }) => accountNature)).toEqual(
      Array(5).fill(AccountNature.ASSET),
    )
    expect(accountRecords.map(({ accountSubType }) => accountSubType)).toEqual([
      null,
      AccountSubType.DEBIT_CARD,
      AccountSubType.ONLINE_PAYMENT,
      AccountSubType.ONLINE_PAYMENT,
      AccountSubType.ONLINE_PAYMENT,
    ])
    expect(accountRecords.map(({ iconKey }) => iconKey)).toEqual([
      'cash',
      'bank-card',
      'paypal',
      'wechat',
      'alipay',
    ])
  })
})
