import type { Server } from 'node:http'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { IconController } from './icon.controller'
import { IconService } from './icon.service'

describe('统一图标接口', () => {
  let app: INestApplication
  const service = {
    catalog: jest.fn().mockResolvedValue({ version: 'version', items: [] }),
  }
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [IconController],
      providers: [{ provide: IconService, useValue: service }],
    }).compile()
    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
    await app.init()
  })
  afterAll(async () => {
    await app.close()
  })
  it('支持完整目录和场景筛选', async () => {
    await request(app.getHttpServer() as Server)
      .get('/icons')
      .expect(200, { version: 'version', items: [] })
    await request(app.getHttpServer() as Server)
      .get('/icons?scene=account&selectableOnly=true')
      .expect(200)
    expect(service.catalog).toHaveBeenLastCalledWith('account', true)
  })
  it.each(['scene=unknown', 'selectableOnly=invalid'])(
    '拒绝非法筛选 %s',
    async (query) => {
      await request(app.getHttpServer() as Server)
        .get('/icons?' + query)
        .expect(400)
    },
  )
})
