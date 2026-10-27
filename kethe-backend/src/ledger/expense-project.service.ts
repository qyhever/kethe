import { IconService } from '../icons/icon.service'
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DataSource } from 'typeorm'
import { ExpenseProject } from './entities/expense-project.entity'
import { Transaction } from './entities/transaction.entity'
import {
  CreateExpenseProjectDto,
  UpdateExpenseProjectDto,
} from './dto/expense-project.dto'
@Injectable()
export class ExpenseProjectService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly icons: IconService,
  ) {}
  options() {
    return this.icons.keys('expense-project')
  }
  async list(userId: number, status = 'active') {
    const items = await this.dataSource.getRepository(ExpenseProject).find({
      where: {
        userId,
        ...(status === 'all' ? {} : { isArchived: status === 'archived' }),
      },
      order: { createdAt: 'DESC', id: 'DESC' },
    })
    if (!items.length) return []
    const rows = await this.dataSource
      .getRepository(Transaction)
      .createQueryBuilder('t')
      .withDeleted()
      .select('t.expenseProjectId', 'id')
      .addSelect(
        'SUM(CASE WHEN t.deletedAt IS NULL AND t.transactionType = 1 THEN t.amount ELSE 0 END)',
        'amount',
      )
      .addSelect(
        'SUM(CASE WHEN t.deletedAt IS NULL AND t.transactionType = 1 THEN 1 ELSE 0 END)',
        'count',
      )
      .addSelect('COUNT(*)', 'references')
      .where('t.userId = :userId', { userId })
      .andWhere('t.expenseProjectId IN (:...ids)', {
        ids: items.map((item) => item.id),
      })
      .groupBy('t.expenseProjectId')
      .getRawMany<{
        id: string
        amount: string
        count: string
        references: string
      }>()
    const totals = new Map(rows.map((row) => [String(row.id), row]))
    return items.map((item) => {
      const total = totals.get(String(item.id))
      return {
        ...item,
        id: String(item.id),
        expenseAmount: String(total?.amount ?? '0'),
        transactionCount: Number(total?.count ?? 0),
        hasTransactions: Number(total?.references ?? 0) > 0,
      }
    })
  }
  async get(userId: number, id: string) {
    const item = (await this.list(userId, 'all')).find((item) => item.id === id)
    if (!item) throw new NotFoundException('消费项目不存在')
    return item
  }
  private validateDates(item: {
    startDate?: string | null
    endDate?: string | null
  }) {
    if (item.startDate && item.endDate && item.endDate < item.startDate)
      throw new BadRequestException('结束日期不得早于开始日期')
  }
  async create(userId: number, dto: CreateExpenseProjectDto) {
    const iconKey =
      dto.iconKey ?? (await this.icons.defaultKey('expense-project'))
    await this.icons.validate('expense-project', iconKey)
    this.validateDates(dto)
    const repo = this.dataSource.getRepository(ExpenseProject)
    const item = await repo.save(
      repo.create({
        ...dto,
        name: dto.name.trim(),
        userId,
        iconKey,
        startDate: dto.startDate ?? null,
        endDate: dto.endDate ?? null,
        remark: dto.remark ?? null,
        isArchived: false,
      }),
    )
    return this.get(userId, String(item.id))
  }
  async update(userId: number, id: string, dto: UpdateExpenseProjectDto) {
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(ExpenseProject)
      const item = await repo.findOne({
        where: { userId, id },
        lock: { mode: 'pessimistic_write' },
      })
      if (!item) throw new NotFoundException('消费项目不存在')
      if (dto.iconKey !== undefined)
        await this.icons.validate(
          'expense-project',
          dto.iconKey,
          item.iconKey,
          manager,
        )
      Object.assign(
        item,
        Object.fromEntries(
          Object.entries(dto).filter(([, value]) => value !== undefined),
        ),
      )
      this.validateDates(item)
      await repo.save(item)
    })
    return this.get(userId, id)
  }
  async remove(userId: number, id: string) {
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(ExpenseProject)
      const item = await repo.findOne({
        where: { userId, id },
        lock: { mode: 'pessimistic_write' },
      })
      if (!item) throw new NotFoundException('消费项目不存在')
      if (
        await manager.getRepository(Transaction).exists({
          where: { userId, expenseProjectId: id },
          withDeleted: true,
        })
      )
        throw new ConflictException('已有流水引用的项目只能归档')
      await repo.softRemove(item)
    })
    return null
  }
  async categories(userId: number, id: string, parentCategoryId?: string) {
    await this.get(userId, id)
    const rows = await this.dataSource
      .getRepository(Transaction)
      .createQueryBuilder('t')
      .leftJoin(
        '(SELECT * FROM categories)',
        'c',
        'c.id = t.categoryId AND c.userId = t.userId',
      )
      .leftJoin(
        '(SELECT * FROM categories)',
        'p',
        'p.id = c.parentId AND p.userId = t.userId',
      )
      .select('c.id', 'id')
      .addSelect('c.name', 'name')
      .addSelect('c.parentId', 'parentId')
      .addSelect('p.name', 'parentName')
      .addSelect('SUM(t.amount)', 'amount')
      .where(
        't.userId = :userId AND t.expenseProjectId = :id AND t.transactionType = 1',
        { userId, id },
      )
      .groupBy('c.id')
      .addGroupBy('c.name')
      .addGroupBy('c.parentId')
      .addGroupBy('p.name')
      .getRawMany<{
        id: string | null
        name: string | null
        parentId: string | null
        parentName: string | null
        amount: string
      }>()
    const groups = new Map<
      string,
      {
        categoryId: string | null
        name: string
        amount: bigint
        canDrillDown: boolean
      }
    >()
    for (const row of rows) {
      if (
        parentCategoryId &&
        String(row.parentId) !== parentCategoryId &&
        String(row.id) !== parentCategoryId
      )
        continue
      const categoryId = parentCategoryId
        ? String(row.id) === parentCategoryId
          ? null
          : row.id
        : (row.parentId ?? row.id)
      const name = parentCategoryId
        ? categoryId === null
          ? '未细分'
          : (row.name ?? '未知分类')
        : ((row.parentId ? row.parentName : row.name) ?? '未知分类')
      const key = categoryId ?? 'direct'
      const group = groups.get(key) ?? {
        categoryId,
        name,
        amount: 0n,
        canDrillDown: !parentCategoryId && categoryId !== null,
      }
      group.amount += BigInt(row.amount)
      groups.set(key, group)
    }
    const total = [...groups.values()].reduce(
      (sum, row) => sum + row.amount,
      0n,
    )
    return {
      expenseAmount: total.toString(),
      list: [...groups.values()]
        .sort((a, b) =>
          a.amount > b.amount ? -1 : a.amount < b.amount ? 1 : 0,
        )
        .map((row) => ({
          ...row,
          amount: row.amount.toString(),
          percentage:
            total === 0n ? 0 : Number((row.amount * 10000n) / total) / 100,
        })),
    }
  }
}
