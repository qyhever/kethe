import { NotFoundException } from '@nestjs/common'
import { MerchantService } from './merchant.service'
import { Merchant } from './entities/merchant.entity'
function setup() {
  const item = {
    id: '9007199254740993',
    userId: 42,
    name: '超市',
    iconKey: 'store',
    systemKey: 'merchant_supermarket',
    isSystemDefault: true,
  }
  const repo = {
    find: jest.fn().mockResolvedValue([item]),
    findOneBy: jest.fn().mockResolvedValue(item),
    findOne: jest.fn().mockResolvedValue(item),
    create: jest.fn((data: object) => ({ id: '9007199254740994', ...data })),
    save: jest.fn((data: object) => Promise.resolve(data)),
  }
  const manager = { getRepository: jest.fn().mockReturnValue(repo) }
  const source = {
    ...manager,
    transaction: jest.fn((callback: (manager: unknown) => unknown) =>
      callback(manager),
    ),
  }
  return { repo, item, manager, service: new MerchantService(source as never) }
}
describe('商家管理', () => {
  it('按用户隔离并按排序字段、ID展示，保留大ID字符串', async () => {
    const { service, repo, manager } = setup()
    expect(await service.list(42)).toEqual([
      expect.objectContaining({ id: '9007199254740993' }),
    ])
    expect(manager.getRepository).toHaveBeenCalledWith(Merchant)
    expect(repo.find).toHaveBeenCalledWith({
      where: { userId: 42 },
      order: { sortOrder: 'ASC', id: 'ASC' },
    })
    await service.get(42, '9007199254740993')
    expect(repo.findOneBy).toHaveBeenCalledWith({
      userId: 42,
      id: '9007199254740993',
    })
  })
  it('新增去空白、默认图标并允许同名，编辑保留默认数据标识', async () => {
    const { service, repo, item } = setup()
    for (let i = 0; i < 2; i++)
      expect(await service.create(42, { name: ' 超市 ' })).toMatchObject({
        name: '超市',
        iconKey: 'store',
        userId: 42,
        systemKey: null,
        isSystemDefault: false,
      })
    expect(
      await service.update(42, item.id, { name: ' 新名称 ', iconKey: 'gift' }),
    ).toMatchObject({
      name: '新名称',
      iconKey: 'gift',
      systemKey: 'merchant_supermarket',
      isSystemDefault: true,
    })
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { userId: 42, id: item.id },
      lock: { mode: 'pessimistic_write' },
    })
    expect(await service.update(42, item.id, {})).toMatchObject({
      name: '新名称',
      iconKey: 'gift',
    })
  })
  it('拒绝读取和修改不存在或其他用户的商家', async () => {
    const { service, repo } = setup()
    repo.findOneBy.mockResolvedValue(null)
    repo.findOne.mockResolvedValue(null)
    await expect(service.get(99, '1')).rejects.toBeInstanceOf(NotFoundException)
    await expect(
      service.update(99, '1', { name: '越权' }),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(repo.save).not.toHaveBeenCalled()
  })
})
