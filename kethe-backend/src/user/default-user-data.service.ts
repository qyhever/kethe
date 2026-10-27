import { IconService, type IconScene } from '../icons/icon.service'
import { Merchant } from '../ledger/entities/merchant.entity'
import { Member } from './entities/member.entity'
import { DEFAULT_MEMBERS } from './member-options'
import { Injectable } from '@nestjs/common'
import type { EntityManager, Repository } from 'typeorm'
import {
  DEFAULT_MERCHANTS,
  DEFAULT_ACCOUNTS,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  EXPENSE_CATEGORY_TYPE,
  INCOME_CATEGORY_TYPE,
} from './default-user-data.constants'
import { Account } from './entities/account.entity'
import { Category } from './entities/category.entity'

@Injectable()
export class DefaultUserDataService {
  constructor(private readonly icons: IconService) {}
  async initialize(userId: number, manager: EntityManager): Promise<void> {
    const categoryRepository = manager.getRepository(Category)
    const accountRepository = manager.getRepository(Account)

    await this.createCategories(userId, categoryRepository)
    await this.createAccounts(userId, accountRepository, manager)
    const members = manager.getRepository(Member)
    const existing = new Set(
      (await members.find({ where: { userId }, withDeleted: true })).map(
        (item) => item.systemKey,
      ),
    )
    const missing = await Promise.all(
      DEFAULT_MEMBERS.map((definition, index) => ({ definition, index }))
        .filter(({ definition }) => !existing.has(definition.systemKey))
        .map(async ({ definition, index }) =>
          members.create({
            userId,
            ...definition,
            iconKey: await this.initialIcon(
              'member',
              definition.iconKey,
              manager,
            ),
            isSystemDefault: true,
            sortOrder: index + 1,
          }),
        ),
    )
    if (missing.length) await members.save(missing)
    const merchants = manager.getRepository(Merchant)
    const existingMerchants = new Set(
      (await merchants.find({ where: { userId } })).map(
        (item) => item.systemKey,
      ),
    )
    const missingMerchants = await Promise.all(
      DEFAULT_MERCHANTS.map((definition, index) => ({ definition, index }))
        .filter(
          ({ definition }) => !existingMerchants.has(definition.systemKey),
        )
        .map(async ({ definition, index }) =>
          merchants.create({
            userId,
            ...definition,
            iconKey: await this.initialIcon(
              'merchant',
              definition.iconKey,
              manager,
            ),
            isSystemDefault: true,
            sortOrder: index + 1,
          }),
        ),
    )
    if (missingMerchants.length) await merchants.save(missingMerchants)
  }

  private async createCategories(
    userId: number,
    repository: Repository<Category>,
  ): Promise<void> {
    for (const [
      parentIndex,
      definition,
    ] of DEFAULT_EXPENSE_CATEGORIES.entries()) {
      let parent = await repository.findOne({
        where: { userId, systemKey: definition.systemKey },
        withDeleted: true,
      })
      if (!parent) {
        parent = await repository.save(
          repository.create({
            userId,
            categoryType: EXPENSE_CATEGORY_TYPE,
            parentId: null,
            name: definition.name,
            iconId: await this.findIconId(repository, definition.systemKey),
            systemKey: definition.systemKey,
            isSystemDefault: true,
            sortOrder: parentIndex + 1,
            isEnabled: true,
          }),
        )
      }

      const existingKeys = new Set(
        (
          await repository.find({
            where: { userId, parentId: parent.id },
            withDeleted: true,
          })
        ).map((category) => category.systemKey),
      )
      const children = await Promise.all(
        definition.children
          .map((child, childIndex) => ({ child, childIndex }))
          .filter(({ child }) => !existingKeys.has(child.systemKey))
          .map(async ({ child, childIndex }) =>
            repository.create({
              userId,
              categoryType: EXPENSE_CATEGORY_TYPE,
              parentId: parent.id,
              name: child.name,
              iconId: await this.findIconIdByKey(repository, child.iconKey),
              systemKey: child.systemKey,
              isSystemDefault: true,
              sortOrder: childIndex + 1,
              isEnabled: true,
            }),
          ),
      )
      if (children.length) await repository.save(children)
    }

    const incomeKeys = new Set(
      (
        await repository.find({
          where: { userId, categoryType: INCOME_CATEGORY_TYPE },
          withDeleted: true,
        })
      ).map((category) => category.systemKey),
    )
    const incomeCategories = await Promise.all(
      DEFAULT_INCOME_CATEGORIES.map((definition, index) => ({
        definition,
        index,
      }))
        .filter(({ definition }) => !incomeKeys.has(definition.systemKey))
        .map(async ({ definition, index }) =>
          repository.create({
            userId,
            categoryType: INCOME_CATEGORY_TYPE,
            parentId: null,
            name: definition.name,
            iconId: await this.findIconIdByKey(repository, definition.iconKey),
            systemKey: definition.systemKey,
            isSystemDefault: true,
            sortOrder: index + 1,
            isEnabled: true,
          }),
        ),
    )
    if (incomeCategories.length) await repository.save(incomeCategories)
  }

  private async createAccounts(
    userId: number,
    repository: Repository<Account>,
    manager: EntityManager,
  ): Promise<void> {
    const existingKeys = new Set(
      (await repository.find({ where: { userId }, withDeleted: true })).map(
        (account) => account.systemKey,
      ),
    )
    const accounts = await Promise.all(
      DEFAULT_ACCOUNTS.map((definition, index) => ({
        definition,
        index,
      }))
        .filter(({ definition }) => !existingKeys.has(definition.systemKey))
        .map(async ({ definition, index }) =>
          repository.create({
            userId,
            ...definition,
            iconKey: await this.initialAccountIcon(definition, manager),
            isSystemDefault: true,
            currency: 'CNY',
            initialBalance: '0',
            currentBalance: '0',
            institutionName: null,
            accountNumberLast4: null,
            creditLimit: null,
            includeInNetWorth: true,
            sortOrder: index + 1,
            isEnabled: true,
            remark: null,
          }),
        ),
    )
    if (accounts.length) await repository.save(accounts)
  }

  private async initialIcon(
    scene: IconScene,
    key: string,
    manager: EntityManager,
  ) {
    const match = (await this.icons.list(scene, true, manager)).find(
      (item) => item.iconKey === key,
    )
    return match?.iconKey ?? this.icons.defaultKey(scene, manager)
  }

  private async initialAccountIcon(
    definition: {
      iconKey: string
      accountType: number
      accountSubType: number | null
    },
    manager: EntityManager,
  ) {
    const items = await this.icons.list('account', true, manager)
    const rules = await this.icons.accountRules(manager)
    if (
      items.some((item) => item.iconKey === definition.iconKey) &&
      rules.some(
        (rule) =>
          rule.iconKey === definition.iconKey &&
          rule.accountType === definition.accountType,
      )
    )
      return definition.iconKey
    return this.icons.defaultAccountKey(
      definition.accountType,
      definition.accountSubType,
      manager,
    )
  }

  private async findIconId(
    repository: Repository<Category>,
    systemKey: string,
  ): Promise<string | null> {
    const iconKey = systemKey.replace(/^expense_/, '').split('_')[0]
    return this.findIconIdByKey(repository, iconKey)
  }

  private async findIconIdByKey(
    repository: Repository<Category>,
    iconKey: string,
  ): Promise<string | null> {
    const rows = await repository.manager.query<Array<{ id: string }>>(
      'SELECT id FROM category_icon_resources WHERE iconKey = ? AND isEnabled = 1 LIMIT 1',
      [iconKey],
    )
    return rows[0]?.id ?? null
  }
}
