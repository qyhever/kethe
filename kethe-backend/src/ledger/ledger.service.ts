import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { DataSource, In, IsNull, Repository } from 'typeorm'
import { Account } from '../user/entities/account.entity'
import { Category } from '../user/entities/category.entity'
import {
  CreateAccountDto,
  CreateCategoryDto,
  CreateTransactionDto,
  TransactionQueryDto,
  UpdateAccountDto,
  UpdateCategoryDto,
  UpdateOrderDto,
} from './dto/ledger.dto'
import { CategoryIcon } from './entities/category-icon.entity'
import { Transaction, TransactionType } from './entities/transaction.entity'
import { calculateBalanceChanges } from './balance'

dayjs.extend(utc)
dayjs.extend(timezone)
const ZONE = 'Asia/Shanghai'

interface CategoryRow {
  id: string
  categoryType: number
  parentId: string | null
  name: string
  iconId: string | null
  systemKey: string | null
  isSystemDefault: boolean
  sortOrder: number
  isEnabled: boolean
  iconKey: string | null
  svgContent: string | null
  iconColor: string | null
}

interface TransactionRow {
  id: string
  transactionType: number
  amount: string
  currency: string
  remark: string | null
  transactionTime: Date | string
  createdAt: Date | string
  categoryId: string | null
  categoryName: string | null
  parentCategoryId: string | null
  parentCategoryName: string | null
  iconKey: string | null
  svgContent: string | null
  iconColor: string | null
  accountId: string
  accountName: string
  targetAccountId: string | null
  targetAccountName: string | null
}

@Injectable()
export class LedgerService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
    @InjectRepository(Account)
    private readonly accounts: Repository<Account>,
    @InjectRepository(CategoryIcon)
    private readonly icons: Repository<CategoryIcon>,
    @InjectRepository(Transaction)
    private readonly transactions: Repository<Transaction>,
  ) {}

  async listIcons() {
    const items = await this.icons.find({
      where: { isEnabled: true },
      order: { id: 'ASC' },
    })
    return items.map((item) => ({ ...item, id: String(item.id) }))
  }

  async listCategories(userId: number, categoryType?: number) {
    const qb = this.categories
      .createQueryBuilder('c')
      .leftJoin(CategoryIcon, 'i', 'i.id = c.iconId')
      .select([
        'c.id id',
        'c.categoryType categoryType',
        'c.parentId parentId',
        'c.name name',
        'c.iconId iconId',
        'c.systemKey systemKey',
        'c.isSystemDefault isSystemDefault',
        'c.sortOrder sortOrder',
        'c.isEnabled isEnabled',
        'i.iconKey iconKey',
        'i.svgContent svgContent',
        'i.color iconColor',
      ])
      .where('c.userId = :userId', { userId })
      .orderBy('c.sortOrder', 'ASC')
      .addOrderBy('c.id', 'ASC')
    if (categoryType)
      qb.andWhere('c.categoryType = :categoryType', { categoryType })
    const rows = await qb.getRawMany<CategoryRow>()
    const parents = rows.filter((row) => row.parentId === null)
    return parents.map((parent) => ({
      ...parent,
      id: String(parent.id),
      categoryType: Number(parent.categoryType),
      iconId: parent.iconId === null ? null : String(parent.iconId),
      isSystemDefault: Boolean(parent.isSystemDefault),
      isEnabled: Boolean(parent.isEnabled),
      sortOrder: Number(parent.sortOrder),
      children: rows
        .filter((row) => String(row.parentId) === String(parent.id))
        .map((child) => ({
          ...child,
          id: String(child.id),
          categoryType: Number(child.categoryType),
          parentId: String(child.parentId),
          iconId: child.iconId === null ? parent.iconId : String(child.iconId),
          iconKey: child.iconKey ?? parent.iconKey,
          svgContent: child.svgContent ?? parent.svgContent,
          iconColor: child.iconColor ?? parent.iconColor,
          isSystemDefault: Boolean(child.isSystemDefault),
          isEnabled: Boolean(child.isEnabled),
          sortOrder: Number(child.sortOrder),
        })),
    }))
  }

  async createCategory(userId: number, dto: CreateCategoryDto) {
    let parent: Category | null = null
    if (dto.parentId) {
      parent = await this.categories.findOneBy({ id: dto.parentId, userId })
      if (!parent) throw new BadRequestException('父分类不存在或无权访问')
      if (parent.parentId) throw new BadRequestException('支出分类最多支持两级')
      if (dto.categoryType !== 1 || parent.categoryType !== dto.categoryType) {
        throw new BadRequestException(
          '收入不支持子分类，且父子分类类型必须一致',
        )
      }
    }
    if (
      dto.iconId &&
      !(await this.icons.existsBy({ id: dto.iconId, isEnabled: true }))
    ) {
      throw new BadRequestException('分类图标不存在或已停用')
    }
    const entity = this.categories.create({
      userId,
      categoryType: dto.categoryType,
      parentId: parent?.id ?? null,
      name: dto.name.trim(),
      iconId: dto.iconId ?? null,
      systemKey: null,
      isSystemDefault: false,
      sortOrder: dto.sortOrder ?? 0,
      isEnabled: true,
    })
    return this.categories.save(entity)
  }

  async updateCategory(userId: number, id: string, dto: UpdateCategoryDto) {
    const entity = await this.categories.findOneBy({ id, userId })
    if (!entity) throw new NotFoundException('分类不存在')
    if (
      dto.iconId &&
      !(await this.icons.existsBy({ id: dto.iconId, isEnabled: true }))
    ) {
      throw new BadRequestException('分类图标不存在或已停用')
    }
    if (dto.name !== undefined) entity.name = dto.name.trim()
    if (dto.iconId !== undefined) entity.iconId = dto.iconId
    if (dto.sortOrder !== undefined) entity.sortOrder = dto.sortOrder
    if (dto.isEnabled !== undefined) entity.isEnabled = dto.isEnabled
    return this.categories.save(entity)
  }

  async orderCategories(userId: number, dto: UpdateOrderDto) {
    const uniqueIds = [...new Set(dto.items.map((item) => item.id))]
    if (uniqueIds.length !== dto.items.length)
      throw new BadRequestException('分类 ID 不能重复')
    const entities = await this.categories.findBy({ userId, id: In(uniqueIds) })
    if (entities.length !== uniqueIds.length)
      throw new BadRequestException('分类不存在或无权访问')
    const order = new Map(dto.items.map((item) => [item.id, item.sortOrder]))
    for (const entity of entities)
      entity.sortOrder = order.get(String(entity.id))!
    await this.categories.save(entities)
    return null
  }

  async deleteCategory(userId: number, id: string) {
    const entity = await this.categories.findOneBy({ id, userId })
    if (!entity) throw new NotFoundException('分类不存在')
    const referenced = await this.transactions.existsBy({ categoryId: id })
    const hasChildren = await this.categories.existsBy({ parentId: id, userId })
    if (entity.isSystemDefault || referenced || hasChildren) {
      throw new ConflictException('系统默认、已使用或包含子分类的分类只能停用')
    }
    await this.categories.softRemove(entity)
    return null
  }

  async listAccounts(userId: number) {
    const items = await this.accounts.find({
      where: { userId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    return items.map((item) => this.accountView(item))
  }

  async getAccount(userId: number, id: string) {
    const item = await this.accounts.findOneBy({ id, userId })
    if (!item) throw new NotFoundException('账户不存在')
    return this.accountView(item)
  }

  async createAccount(userId: number, dto: CreateAccountDto) {
    const entity = this.accounts.create({
      userId,
      name: dto.name.trim(),
      accountType: dto.accountType,
      icon: dto.icon ?? null,
      systemKey: null,
      isSystemDefault: false,
      currency: dto.currency,
      initialBalance: dto.initialBalance,
      currentBalance: dto.initialBalance,
      includeInAssets: dto.includeInAssets ?? true,
      sortOrder: dto.sortOrder ?? 0,
      isEnabled: true,
      remark: dto.remark ?? null,
    })
    return this.accountView(await this.accounts.save(entity))
  }

  async updateAccount(userId: number, id: string, dto: UpdateAccountDto) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Account)
      const entity = await repository.findOne({
        where: { id, userId },
        lock: { mode: 'pessimistic_write' },
      })
      if (!entity) throw new NotFoundException('账户不存在')
      if (
        dto.initialBalance !== undefined &&
        dto.initialBalance !== entity.initialBalance
      ) {
        const used = await manager.getRepository(Transaction).exists({
          where: [
            { accountId: id, deletedAt: IsNull() },
            { targetAccountId: id, deletedAt: IsNull() },
          ],
          withDeleted: true,
        })
        if (used) throw new ConflictException('账户已有流水，不能修改初始余额')
        entity.currentBalance = (
          BigInt(entity.currentBalance) +
          BigInt(dto.initialBalance) -
          BigInt(entity.initialBalance)
        ).toString()
        entity.initialBalance = dto.initialBalance
      }
      if (dto.name !== undefined) entity.name = dto.name.trim()
      if (dto.accountType !== undefined) entity.accountType = dto.accountType
      if (dto.icon !== undefined) entity.icon = dto.icon
      if (dto.includeInAssets !== undefined)
        entity.includeInAssets = dto.includeInAssets
      if (dto.sortOrder !== undefined) entity.sortOrder = dto.sortOrder
      if (dto.isEnabled !== undefined) entity.isEnabled = dto.isEnabled
      if (dto.remark !== undefined) entity.remark = dto.remark
      return this.accountView(await repository.save(entity))
    })
  }

  async orderAccounts(userId: number, dto: UpdateOrderDto) {
    const uniqueIds = [...new Set(dto.items.map((item) => item.id))]
    if (uniqueIds.length !== dto.items.length)
      throw new BadRequestException('账户 ID 不能重复')
    const entities = await this.accounts.findBy({ userId, id: In(uniqueIds) })
    if (entities.length !== uniqueIds.length)
      throw new BadRequestException('账户不存在或无权访问')
    const order = new Map(dto.items.map((item) => [item.id, item.sortOrder]))
    for (const entity of entities)
      entity.sortOrder = order.get(String(entity.id))!
    await this.accounts.save(entities)
    return null
  }

  async deleteAccount(userId: number, id: string) {
    const entity = await this.accounts.findOneBy({ id, userId })
    if (!entity) throw new NotFoundException('账户不存在')
    const referenced = await this.transactions.exists({
      where: [{ accountId: id }, { targetAccountId: id }],
      withDeleted: true,
    })
    if (entity.isSystemDefault || referenced) {
      throw new ConflictException('系统默认或已使用的账户只能停用')
    }
    await this.accounts.softRemove(entity)
    return null
  }

  async createTransaction(userId: number, dto: CreateTransactionDto) {
    return this.dataSource.transaction(async (manager) => {
      const accountIds = [dto.accountId, dto.targetAccountId].filter(
        (id): id is string => !!id,
      )
      const accounts = await this.lockAccounts(manager, userId, accountIds)
      const category = await this.validateTransactionResources(
        manager,
        userId,
        dto,
        accounts,
      )
      const entity = manager.getRepository(Transaction).create({
        userId,
        transactionType: dto.transactionType,
        amount: dto.amount,
        categoryId: category?.id ?? null,
        accountId: dto.accountId,
        targetAccountId: dto.targetAccountId ?? null,
        currency: dto.currency,
        transactionTime: new Date(dto.transactionTime),
        remark: dto.remark ?? null,
      })
      this.applyBalance(accounts, entity, 1)
      await manager.getRepository(Account).save([...accounts.values()])
      const saved = await manager.getRepository(Transaction).save(entity)
      return this.getTransactionWithManager(manager, userId, saved.id)
    })
  }

  async updateTransaction(
    userId: number,
    id: string,
    dto: CreateTransactionDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Transaction)
      const old = await repository.findOne({
        where: { id, userId },
        lock: { mode: 'pessimistic_write' },
      })
      if (!old) throw new NotFoundException('流水不存在')
      const accountIds = [
        old.accountId,
        old.targetAccountId,
        dto.accountId,
        dto.targetAccountId,
      ].filter((value): value is string => !!value)
      const accounts = await this.lockAccounts(manager, userId, accountIds)
      const category = await this.validateTransactionResources(
        manager,
        userId,
        dto,
        accounts,
      )
      this.applyBalance(accounts, old, -1)
      Object.assign(old, {
        transactionType: dto.transactionType,
        amount: dto.amount,
        categoryId: category?.id ?? null,
        accountId: dto.accountId,
        targetAccountId: dto.targetAccountId ?? null,
        currency: dto.currency,
        transactionTime: new Date(dto.transactionTime),
        remark: dto.remark ?? null,
      })
      this.applyBalance(accounts, old, 1)
      await manager.getRepository(Account).save([...accounts.values()])
      await repository.save(old)
      return this.getTransactionWithManager(manager, userId, id)
    })
  }

  async deleteTransaction(userId: number, id: string) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Transaction)
      const entity = await repository.findOne({
        where: { id, userId },
        lock: { mode: 'pessimistic_write' },
      })
      if (!entity) throw new NotFoundException('流水不存在')
      const accounts = await this.lockAccounts(
        manager,
        userId,
        [entity.accountId, entity.targetAccountId].filter(
          (value): value is string => !!value,
        ),
      )
      this.applyBalance(accounts, entity, -1)
      await manager.getRepository(Account).save([...accounts.values()])
      await repository.softRemove(entity)
      return null
    })
  }

  getTransaction(userId: number, id: string) {
    return this.getTransactionWithManager(this.dataSource.manager, userId, id)
  }

  async listTransactions(userId: number, query: TransactionQueryDto) {
    const qb = this.transactionQuery(this.dataSource.manager, userId, query)
    const total = await qb.getCount()
    const rows = await qb
      .orderBy('t.transactionTime', 'DESC')
      .addOrderBy('t.id', 'DESC')
      .skip((query.currentPage - 1) * query.pageSize)
      .take(query.pageSize)
      .getRawMany<TransactionRow>()
    const list = rows.map((row) => this.transactionView(row))
    const groups = new Map<
      string,
      { date: string; income: bigint; expense: bigint; list: unknown[] }
    >()
    for (const item of list) {
      const date = dayjs(item.transactionTime).tz(ZONE).format('YYYY-MM-DD')
      const group = groups.get(date) ?? {
        date,
        income: 0n,
        expense: 0n,
        list: [],
      }
      if (item.transactionType === 2) group.income += BigInt(item.amount)
      if (item.transactionType === 1) group.expense += BigInt(item.amount)
      group.list.push(item)
      groups.set(date, group)
    }
    return {
      list,
      groups: [...groups.values()].map((group) => ({
        ...group,
        income: group.income.toString(),
        expense: group.expense.toString(),
      })),
      total,
      currentPage: query.currentPage,
      pageSize: query.pageSize,
    }
  }

  async listAllTransactions(userId: number, query: TransactionQueryDto) {
    const rows = await this.transactionQuery(
      this.dataSource.manager,
      userId,
      query,
    )
      .orderBy('t.transactionTime', 'DESC')
      .addOrderBy('t.id', 'DESC')
      .getRawMany<TransactionRow>()
    return rows.map((row) => this.transactionView(row))
  }

  transactionQuery(
    manager: DataSource['manager'],
    userId: number,
    query: TransactionQueryDto,
  ) {
    const qb = manager
      .getRepository(Transaction)
      .createQueryBuilder('t')
      .leftJoin(Category, 'c', 'c.id = t.categoryId')
      .leftJoin(Category, 'p', 'p.id = c.parentId')
      .leftJoin(CategoryIcon, 'ci', 'ci.id = c.iconId')
      .leftJoin(CategoryIcon, 'pi', 'pi.id = p.iconId')
      .leftJoin(Account, 'a', 'a.id = t.accountId')
      .leftJoin(Account, 'ta', 'ta.id = t.targetAccountId')
      .select([
        't.id id',
        't.transactionType transactionType',
        't.amount amount',
        't.currency currency',
        't.remark remark',
        't.transactionTime transactionTime',
        't.createdAt createdAt',
        'c.id categoryId',
        'c.name categoryName',
        'p.id parentCategoryId',
        'p.name parentCategoryName',
        'COALESCE(ci.iconKey, pi.iconKey) iconKey',
        'COALESCE(ci.svgContent, pi.svgContent) svgContent',
        'COALESCE(ci.color, pi.color) iconColor',
        'a.id accountId',
        'a.name accountName',
        'ta.id targetAccountId',
        'ta.name targetAccountName',
      ])
      .where('t.userId = :userId', { userId })
    if (query.startTime)
      qb.andWhere('t.transactionTime >= :startTime', {
        startTime: new Date(query.startTime),
      })
    if (query.endTime)
      qb.andWhere('t.transactionTime < :endTime', {
        endTime: new Date(query.endTime),
      })
    if (query.transactionType)
      qb.andWhere('t.transactionType = :transactionType', query)
    if (query.categoryId)
      qb.andWhere(
        '(t.categoryId = :categoryId OR c.parentId = :categoryId)',
        query,
      )
    if (query.accountId)
      qb.andWhere(
        '(t.accountId = :accountId OR t.targetAccountId = :accountId)',
        query,
      )
    if (query.minAmount) qb.andWhere('t.amount >= :minAmount', query)
    if (query.maxAmount) qb.andWhere('t.amount <= :maxAmount', query)
    if (query.keyword) {
      const amount = /^[1-9]\d*$/.test(query.keyword) ? query.keyword : null
      qb.andWhere(
        '(t.remark LIKE :keyword OR c.name LIKE :keyword OR p.name LIKE :keyword OR a.name LIKE :keyword OR ta.name LIKE :keyword' +
          (amount ? ' OR t.amount = :keywordAmount)' : ')'),
        { keyword: `%${query.keyword}%`, keywordAmount: amount },
      )
    }
    return qb
  }

  private async lockAccounts(
    manager: DataSource['manager'],
    userId: number,
    ids: string[],
  ) {
    const uniqueIds = [...new Set(ids)].sort((a, b) =>
      BigInt(a) < BigInt(b) ? -1 : 1,
    )
    const rows = uniqueIds.length
      ? await manager.getRepository(Account).find({
          where: { userId, id: In(uniqueIds) },
          order: { id: 'ASC' },
          lock: { mode: 'pessimistic_write' },
        })
      : []
    if (rows.length !== uniqueIds.length)
      throw new BadRequestException('账户不存在或无权访问')
    return new Map(rows.map((account) => [String(account.id), account]))
  }

  private async validateTransactionResources(
    manager: DataSource['manager'],
    userId: number,
    dto: CreateTransactionDto,
    accounts: Map<string, Account>,
  ) {
    const account = accounts.get(dto.accountId)!
    if (!account.isEnabled) throw new BadRequestException('账户已停用')
    if (account.currency !== dto.currency)
      throw new BadRequestException('流水币种必须与账户一致')
    if (dto.transactionType === TransactionType.TRANSFER) {
      if (dto.categoryId || !dto.targetAccountId)
        throw new BadRequestException('转账不能选择分类，且必须指定目标账户')
      if (dto.targetAccountId === dto.accountId)
        throw new BadRequestException('转出和转入账户不能相同')
      const target = accounts.get(dto.targetAccountId)!
      if (!target.isEnabled) throw new BadRequestException('目标账户已停用')
      if (
        target.currency !== dto.currency ||
        target.currency !== account.currency
      ) {
        throw new BadRequestException('转账双方账户币种必须一致')
      }
      return null
    }
    if (!dto.categoryId || dto.targetAccountId)
      throw new BadRequestException('收支流水必须选择分类且不能指定目标账户')
    const category = await manager
      .getRepository(Category)
      .findOneBy({ id: dto.categoryId, userId })
    if (!category || !category.isEnabled)
      throw new BadRequestException('分类不存在、已删除或已停用')
    if (category.categoryType !== Number(dto.transactionType))
      throw new BadRequestException('分类类型与流水类型不一致')
    return category
  }

  private applyBalance(
    accounts: Map<string, Account>,
    transaction: Transaction,
    direction: 1 | -1,
  ) {
    for (const [id, delta] of calculateBalanceChanges(transaction, direction)) {
      const account = accounts.get(String(id))!
      account.currentBalance = (
        BigInt(account.currentBalance) + delta
      ).toString()
    }
  }

  private async getTransactionWithManager(
    manager: DataSource['manager'],
    userId: number,
    id: string,
  ) {
    const row = await this.transactionQuery(
      manager,
      userId,
      new TransactionQueryDto(),
    )
      .andWhere('t.id = :id', { id })
      .getRawOne<TransactionRow>()
    if (!row) throw new NotFoundException('流水不存在')
    return this.transactionView(row)
  }

  private transactionView(row: TransactionRow) {
    return {
      ...row,
      id: String(row.id),
      transactionType: Number(row.transactionType),
      amount: String(row.amount),
      categoryId: row.categoryId === null ? null : String(row.categoryId),
      parentCategoryId:
        row.parentCategoryId === null ? null : String(row.parentCategoryId),
      accountId: String(row.accountId),
      targetAccountId:
        row.targetAccountId === null ? null : String(row.targetAccountId),
      transactionTime: new Date(String(row.transactionTime)).toISOString(),
      createdAt: new Date(String(row.createdAt)).toISOString(),
    }
  }

  private accountView(account: Account) {
    return {
      ...account,
      id: String(account.id),
      initialBalance: String(account.initialBalance),
      currentBalance: String(account.currentBalance),
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
    }
  }
}
