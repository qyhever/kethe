import type { Server } from 'node:http'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { MemberController } from './member.controller'
import { MemberService } from './member.service'

describe('成员 HTTP 接口', () => {
  let app: INestApplication
  let server: Server
  const service = {
    list: jest.fn().mockResolvedValue([]),
    options: jest.fn().mockReturnValue(['user', 'family']),
    get: jest.fn().mockResolvedValue({ id: '1', name: '本人' }),
    create: jest.fn().mockResolvedValue({ id: '1' }),
    update: jest.fn().mockResolvedValue({ id: '1' }),
    remove: jest.fn().mockResolvedValue(null),
  }
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [MemberController],
      providers: [{ provide: MemberService, useValue: service }],
    }).compile()
    app = module.createNestApplication()
    app.use(
      (req: { user: { id: number } }, _res: unknown, next: () => void) => {
        req.user = { id: 42 }
        next()
      },
    )
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))
    await app.init()
    server = app.getHttpServer() as Server
  })
  afterAll(async () => {
    await app.close()
  })
  it('options 路由优先于 ID，所有资源接口使用当前用户', async () => {
    await request(server)
      .get('/members/options')
      .expect(200, ['user', 'family'])
    await request(server).get('/members').expect(200)
    await request(server).get('/members/1').expect(200)
    await request(server)
      .post('/members')
      .send({ name: ' 本人 ', iconKey: 'user' })
      .expect(201)
    await request(server)
      .patch('/members/1')
      .send({ name: ' 自己 ', iconKey: 'heart' })
      .expect(200)
    await request(server).delete('/members/1').expect(200)
    expect(service.list).toHaveBeenCalledWith(42)
    expect(service.get).toHaveBeenCalledWith(42, '1')
    expect(service.create).toHaveBeenCalledWith(42, {
      name: '本人',
      iconKey: 'user',
    })
    expect(service.update).toHaveBeenCalledWith(42, '1', {
      name: '自己',
      iconKey: 'heart',
    })
    expect(service.remove).toHaveBeenCalledWith(42, '1')
  })
  it('拒绝无效 ID、空名称、过长名称、未知图标和 null 修改', async () => {
    await request(server).get('/members/0').expect(400)
    await request(server).delete('/members/not-id').expect(400)
    await request(server)
      .post('/members')
      .send({ name: '   ', iconKey: 'user' })
      .expect(400)
    await request(server)
      .post('/members')
      .send({ name: '一'.repeat(13), iconKey: 'user' })
      .expect(400)
    await request(server)
      .post('/members')
      .send({ name: '本人', iconKey: 'invalid_key' })
      .expect(400)
    await request(server).patch('/members/1').send({ name: null }).expect(400)
    await request(server)
      .patch('/members/1')
      .send({ iconKey: null })
      .expect(400)
  })
})
