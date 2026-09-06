import { Injectable } from '@nestjs/common'
import type { EntityManager, Repository } from 'typeorm'
import {
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
  async initialize(userId: number, manager: EntityManager): Promise<void> {
    const categoryRepository = manager.getRepository(Category)
    const accountRepository = manager.getRepository(Account)

    await this.createCategories(userId, categoryRepository)
    await this.createAccounts(userId, accountRepository)
  }

  private async createCategories(
    userId: number,
    repository: Repository<Category>,
  ): Promise<void> {
    for (const [
      parentIndex,
      definition,
    ] of DEFAULT_EXPENSE_CATEGORIES.entries()) {
      const parent = await repository.save(
        repository.create({
          userId,
          categoryType: EXPENSE_CATEGORY_TYPE,
          parentId: null,
          name: definition.name,
          iconId: null,
          systemKey: definition.systemKey,
          isSystemDefault: true,
          sortOrder: parentIndex + 1,
          isEnabled: true,
        }),
      )

      const children = definition.children.map((child, childIndex) =>
        repository.create({
          userId,
          categoryType: EXPENSE_CATEGORY_TYPE,
          parentId: parent.id,
          name: child.name,
          iconId: null,
          systemKey: child.systemKey,
          isSystemDefault: true,
          sortOrder: childIndex + 1,
          isEnabled: true,
        }),
      )
      await repository.save(children)
    }

    const incomeCategories = DEFAULT_INCOME_CATEGORIES.map(
      (definition, index) =>
        repository.create({
          userId,
          categoryType: INCOME_CATEGORY_TYPE,
          parentId: null,
          name: definition.name,
          iconId: null,
          systemKey: definition.systemKey,
          isSystemDefault: true,
          sortOrder: index + 1,
          isEnabled: true,
        }),
    )
    await repository.save(incomeCategories)
  }

  private async createAccounts(
    userId: number,
    repository: Repository<Account>,
  ): Promise<void> {
    const accounts = DEFAULT_ACCOUNTS.map((definition, index) =>
      repository.create({
        userId,
        ...definition,
        icon: null,
        isSystemDefault: true,
        currency: 'CNY',
        initialBalance: 0,
        currentBalance: 0,
        includeInAssets: true,
        sortOrder: index + 1,
        isEnabled: true,
        remark: null,
      }),
    )
    await repository.save(accounts)
  }
}
