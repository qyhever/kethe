import { BadRequestException, NotFoundException } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { MemberService } from './member.service'
import { CreateMemberDto, UpdateMemberDto } from './dto/member.dto'
import { CreateTransactionDto, TransactionQueryDto } from './dto/ledger.dto'
import { LedgerService } from './ledger.service'
import { Member } from '../user/entities/member.entity'

describe('成员校验', () => {
  it.each(['', '   ', '一'.repeat(13), null, 42])(
    '拒绝无效名称 %s',
    async (name) => {
      expect(
        await validate(
          plainToInstance(CreateMemberDto, { name, iconKey: 'user' }),
        ),
      ).not.toHaveLength(0)
    },
  )
  it('名称去除首尾空格，限制图标，PATCH 不接受 null', async () => {
    const dto = plainToInstance(CreateMemberDto, {
      name: '  本人  ',
      iconKey: 'user',
    })
    expect(dto.name).toBe('本人')
    expect(await validate(dto)).toHaveLength(0)
    expect(
      await validate(
        plainToInstance(CreateMemberDto, { name: '成员', iconKey: 'invalid' }),
      ),
    ).not.toHaveLength(0)
    expect(
      await validate(plainToInstance(UpdateMemberDto, { name: null })),
    ).not.toHaveLength(0)
    expect(await validate(plainToInstance(UpdateMemberDto, {}))).toHaveLength(0)
  })
  it('流水可清空成员，拒绝非正整数字符串和无效筛选数组', async () => {
    const dto = {
      transactionType: 1,
      amount: '100',
      categoryId: '1',
      accountId: '2',
      currency: 'CNY',
      transactionTime: '2026-10-20T00:00:00Z',
    }
    expect(
      await validate(
        plainToInstance(CreateTransactionDto, { ...dto, memberId: null }),
      ),
    ).toHaveLength(0)
    expect(
      await validate(
        plainToInstance(CreateTransactionDto, { ...dto, memberId: '0' }),
      ),
    ).not.toHaveLength(0)
    expect(
      await validate(
        plainToInstance(TransactionQueryDto, { memberIds: ['1', '2'] }),
      ),
    ).toHaveLength(0)
    expect(
      await validate(
        plainToInstance(TransactionQueryDto, { memberIds: ['1', 'bad'] }),
      ),
    ).not.toHaveLength(0)
  })
})

function setup() {
  const item = {
    id: '9007199254740993',
    userId: 42,
    name: '本人',
    iconKey: 'user',
    isSystemDefault: true,
    deletedAt: null,
  }
  const repository = {
    find: jest
      .fn()
      .mockResolvedValue([item, { ...item, id: '2', name: '家人' }]),
    findOneBy: jest.fn().mockResolvedValue(item),
    findOne: jest.fn().mockResolvedValue(item),
    create: jest.fn((value: object) => value),
    save: jest.fn((value: object) => Promise.resolve(value)),
    softRemove: jest.fn((value: object) => Promise.resolve(value)),
  }
  const qb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getRawMany: jest
      .fn()
      .mockResolvedValue([{ memberId: item.id, amount: '900719925474099300' }]),
  }
  const manager = { getRepository: jest.fn().mockReturnValue(repository) }
  const dataSource = {
    getRepository: jest.fn((entity: unknown) =>
      entity === Member ? repository : { createQueryBuilder: () => qb },
    ),
    transaction: jest.fn((callback: (value: typeof manager) => unknown) =>
      callback(manager),
    ),
  }
  return {
    item,
    repository,
    qb,
    service: new MemberService(dataSource as never),
  }
}

describe('成员管理', () => {
  it('批量聚合支出，保留大金额字符串并补零', async () => {
    const { service, repository, qb } = setup()
    const rows = await service.list(42)
    expect(rows.map((row) => row.expenseAmount)).toEqual([
      '900719925474099300',
      '0',
    ])
    expect(repository.find).toHaveBeenCalledWith({
      where: { userId: 42 },
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    expect(qb.where).toHaveBeenCalledWith('t.userId = :userId', { userId: 42 })
    expect(qb.andWhere).toHaveBeenCalledWith('t.transactionType = :type', {
      type: 1,
    })
    expect(service.options()).toContain('family')
  })
  it('新增自定义成员并允许编辑默认成员', async () => {
    const { service, repository, item } = setup()
    expect(
      await service.create(42, { name: ' 家人 ', iconKey: 'family' }),
    ).toMatchObject({
      name: '家人',
      userId: 42,
      systemKey: null,
      isSystemDefault: false,
    })
    expect(await service.get(42, item.id)).toMatchObject({ id: item.id })
    expect(
      await service.update(42, item.id, { name: '自己', iconKey: 'heart' }),
    ).toMatchObject({ name: '自己', iconKey: 'heart' })
    await service.update(42, item.id, {})
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { userId: 42, id: item.id },
      lock: { mode: 'pessimistic_write' },
    })
  })
  it('删除成员只做软删除，按用户隔离', async () => {
    const { service, repository, item } = setup()
    expect(await service.remove(42, item.id)).toBeNull()
    expect(repository.softRemove).toHaveBeenCalledWith(item)
    repository.findOne.mockResolvedValue(null)
    repository.findOneBy.mockResolvedValue(null)
    await expect(service.remove(99, item.id)).rejects.toBeInstanceOf(
      NotFoundException,
    )
    await expect(
      service.update(99, item.id, { name: '他人' }),
    ).rejects.toBeInstanceOf(NotFoundException)
    await expect(service.get(99, item.id)).rejects.toBeInstanceOf(
      NotFoundException,
    )
    expect(repository.findOneBy).toHaveBeenLastCalledWith({
      userId: 99,
      id: item.id,
    })
  })
  it.each([{ name: ' ' }, { name: '一'.repeat(13) }, { iconKey: 'invalid' }])(
    '服务拒绝无效数据 %j',
    async (dto) => {
      await expect(setup().service.update(42, '1', dto)).rejects.toBeInstanceOf(
        BadRequestException,
      )
    },
  )
})

describe('流水成员关联', () => {
  const ledger = new LedgerService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  )
  const memberLedger = ledger as unknown as {
    resolveMember: (
      manager: unknown,
      userId: number,
      dto: Partial<CreateTransactionDto>,
      previous?: string | null,
    ) => Promise<string | null>
  }
  const resolve = (...args: Parameters<typeof memberLedger.resolveMember>) =>
    memberLedger.resolveMember(...args)
  const findOne = jest.fn()
  const manager = { getRepository: () => ({ findOne }) }
  beforeEach(() => findOne.mockReset())
  it('创建默认无，编辑未传保留，显式 null 清空', async () => {
    expect(await resolve(manager, 42, { transactionType: 1 })).toBeNull()
    expect(
      await resolve(manager, 42, { transactionType: 2, memberId: null }, '1'),
    ).toBeNull()
    findOne.mockResolvedValue({ id: '1', deletedAt: null })
    expect(await resolve(manager, 42, { transactionType: 1 }, '1')).toBe('1')
    expect(findOne).toHaveBeenCalledWith({
      where: { id: '1', userId: 42 },
      withDeleted: true,
      lock: { mode: 'pessimistic_write' },
    })
  })
  it('允许保留已删除成员，禁止创建或更换到已删除成员', async () => {
    findOne.mockResolvedValue({ id: '1', deletedAt: new Date() })
    expect(
      await resolve(manager, 42, { transactionType: 1, memberId: '1' }, '1'),
    ).toBe('1')
    await expect(
      resolve(manager, 42, { transactionType: 1, memberId: '1' }),
    ).rejects.toBeInstanceOf(BadRequestException)
    await expect(
      resolve(manager, 42, { transactionType: 1, memberId: '1' }, '2'),
    ).rejects.toBeInstanceOf(BadRequestException)
    findOne.mockResolvedValue(null)
    await expect(
      resolve(manager, 99, { transactionType: 1, memberId: '1' }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
  it('转账始终清空成员，拒绝非空参数', async () => {
    expect(await resolve(manager, 42, { transactionType: 3 }, '1')).toBeNull()
    expect(
      await resolve(manager, 42, { transactionType: 3, memberId: null }),
    ).toBeNull()
    await expect(
      resolve(manager, 42, { transactionType: 3, memberId: '1' }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(findOne).not.toHaveBeenCalled()
  })
})
