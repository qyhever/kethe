import { IconService } from '../icons/icon.service'
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DataSource } from 'typeorm'
import { Member } from '../user/entities/member.entity'
import { Transaction, TransactionType } from './entities/transaction.entity'
import { CreateMemberDto, UpdateMemberDto } from './dto/member.dto'

@Injectable()
export class MemberService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly icons: IconService,
  ) {}

  options() {
    return this.icons.keys('member')
  }

  async list(userId: number) {
    const items = await this.dataSource
      .getRepository(Member)
      .find({ where: { userId }, order: { sortOrder: 'ASC', id: 'ASC' } })
    const totals = await this.dataSource
      .getRepository(Transaction)
      .createQueryBuilder('t')
      .select('t.memberId', 'memberId')
      .addSelect('SUM(t.amount)', 'amount')
      .where('t.userId = :userId', { userId })
      .andWhere('t.transactionType = :type', { type: TransactionType.EXPENSE })
      .andWhere('t.memberId IS NOT NULL')
      .groupBy('t.memberId')
      .getRawMany<{ memberId: string; amount: string }>()
    const amounts = new Map(
      totals.map((row) => [String(row.memberId), String(row.amount)]),
    )
    return items.map((item) => ({
      ...item,
      id: String(item.id),
      expenseAmount: amounts.get(String(item.id)) ?? '0',
    }))
  }

  async get(userId: number, id: string) {
    const item = await this.dataSource
      .getRepository(Member)
      .findOneBy({ userId, id })
    if (!item) throw new NotFoundException('成员不存在')
    return { ...item, id: String(item.id) }
  }

  private validate(dto: UpdateMemberDto) {
    if (
      dto.name !== undefined &&
      (typeof dto.name !== 'string' ||
        !dto.name.trim() ||
        [...dto.name.trim()].length > 12)
    )
      throw new BadRequestException('成员名称须为 1 至 12 个字符')
  }

  async create(userId: number, dto: CreateMemberDto) {
    const iconKey = dto.iconKey ?? (await this.icons.defaultKey('member'))
    await this.icons.validate('member', iconKey)
    this.validate(dto)
    const repository = this.dataSource.getRepository(Member)
    return repository.save(
      repository.create({
        userId,
        name: dto.name.trim(),
        iconKey,
        systemKey: null,
        isSystemDefault: false,
        sortOrder: 1000,
      }),
    )
  }

  async update(userId: number, id: string, dto: UpdateMemberDto) {
    this.validate(dto)
    return this.mutate(userId, id, async (item, repository) => {
      if (dto.iconKey !== undefined)
        await this.icons.validate('member', dto.iconKey, item.iconKey)
      if (dto.name !== undefined) item.name = dto.name.trim()
      if (dto.iconKey !== undefined) item.iconKey = dto.iconKey
      return repository.save(item)
    })
  }

  async remove(userId: number, id: string) {
    await this.mutate(userId, id, (item, repository) =>
      repository.softRemove(item),
    )
    return null
  }

  private mutate<T>(
    userId: number,
    id: string,
    action: (
      item: Member,
      repository: import('typeorm').Repository<Member>,
    ) => Promise<T>,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Member)
      const item = await repository.findOne({
        where: { userId, id },
        lock: { mode: 'pessimistic_write' },
      })
      if (!item) throw new NotFoundException('成员不存在')
      return action(item, repository)
    })
  }
}
