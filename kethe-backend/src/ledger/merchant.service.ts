import { IconService } from '../icons/icon.service'
import { Injectable, NotFoundException } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { Merchant } from './entities/merchant.entity'
import { CreateMerchantDto, UpdateMerchantDto } from './dto/merchant.dto'
@Injectable()
export class MerchantService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly icons: IconService,
  ) {}
  options() {
    return this.icons.keys('merchant')
  }
  async list(userId: number) {
    const items = await this.dataSource
      .getRepository(Merchant)
      .find({ where: { userId }, order: { sortOrder: 'ASC', id: 'ASC' } })
    return items.map((item) => ({ ...item, id: String(item.id) }))
  }
  async get(userId: number, id: string) {
    const item = await this.dataSource
      .getRepository(Merchant)
      .findOneBy({ userId, id })
    if (!item) throw new NotFoundException('商家不存在')
    return { ...item, id: String(item.id) }
  }
  async create(userId: number, dto: CreateMerchantDto) {
    const iconKey = dto.iconKey ?? (await this.icons.defaultKey('merchant'))
    await this.icons.validate('merchant', iconKey)
    const repo = this.dataSource.getRepository(Merchant)
    const item = await repo.save(
      repo.create({
        userId,
        name: dto.name.trim(),
        iconKey,
        systemKey: null,
        isSystemDefault: false,
        sortOrder: 100,
      }),
    )
    return { ...item, id: String(item.id) }
  }
  async update(userId: number, id: string, dto: UpdateMerchantDto) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Merchant)
      const item = await repo.findOne({
        where: { userId, id },
        lock: { mode: 'pessimistic_write' },
      })
      if (!item) throw new NotFoundException('商家不存在')
      if (dto.iconKey !== undefined)
        await this.icons.validate(
          'merchant',
          dto.iconKey,
          item.iconKey,
          manager,
        )
      if (dto.name !== undefined) item.name = dto.name.trim()
      if (dto.iconKey !== undefined) item.iconKey = dto.iconKey
      const saved = await repo.save(item)
      return { ...saved, id: String(saved.id) }
    })
  }
}
