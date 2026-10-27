import type { Server } from 'node:http'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { MerchantController } from './merchant.controller'
import { MerchantService } from './merchant.service'
describe('商家控制器', () => {
  let app: INestApplication
  const service = {
    options: jest.fn().mockResolvedValue(['store']),
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn().mockResolvedValue({ id: '1' }),
    create: jest.fn().mockResolvedValue({ id: '1' }),
    update: jest.fn().mockResolvedValue({ id: '1' }),
  }
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [MerchantController],
      providers: [{ provide: MerchantService, useValue: service }],
    }).compile()
    app = module.createNestApplication()
    app.use(
      (req: { user: { id: number } }, _res: unknown, next: () => void) => {
        req.user = { id: 14 }
        next()
      },
    )
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
    await app.init()
  })
  afterAll(async () => {
    await app.close()
  })
  it('固定图标路由不被详情参数捕获', async () => {
    const response = await request(app.getHttpServer() as Server)
      .get('/merchants/options')
      .expect(200)
    expect(response.body).toContain('store')
    expect(service.options).toHaveBeenCalled()
  })
  it.each(['0', 'abc', '-1', '01', '18446744073709551616'])(
    '非法商家ID %s 返回400',
    async (id) => {
      await request(app.getHttpServer() as Server)
        .get('/merchants/' + id)
        .expect(400)
    },
  )
  it('详情限定当前用户并保持字符串ID', async () => {
    await request(app.getHttpServer() as Server)
      .get('/merchants/9007199254740993')
      .expect(200)
    expect(service.get).toHaveBeenCalledWith(14, '9007199254740993')
  })
  it('新增和编辑传入当前用户，名称去空白并拒绝非法值', async () => {
    await request(app.getHttpServer() as Server)
      .get('/merchants')
      .expect(200)
    expect(service.list).toHaveBeenCalledWith(14)
    await request(app.getHttpServer() as Server)
      .post('/merchants')
      .send({ name: ' 超市 ' })
      .expect(201)
    expect(service.create).toHaveBeenCalledWith(
      14,
      expect.objectContaining({ name: '超市' }),
    )
    await request(app.getHttpServer() as Server)
      .patch('/merchants/1')
      .send({ name: '便利店', iconKey: 'store' })
      .expect(200)
    expect(service.update).toHaveBeenCalledWith(
      14,
      '1',
      expect.objectContaining({ name: '便利店', iconKey: 'store' }),
    )
    for (const input of [
      { name: ' ' },
      { name: null },
      { iconKey: 'invalid_key' },
      { iconKey: null },
    ])
      await request(app.getHttpServer() as Server)
        .patch('/merchants/1')
        .send(input)
        .expect(400)
  })
})
