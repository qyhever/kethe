import type { Server } from 'node:http'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ExpenseProjectController } from './expense-project.controller'
import { ExpenseProjectService } from './expense-project.service'
describe('消费项目控制器', () => {
  let app: INestApplication
  const service = {
    options: jest.fn().mockResolvedValue(['folder']),
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn().mockResolvedValue({ id: '1' }),
    create: jest.fn().mockResolvedValue({ id: '1' }),
    update: jest.fn().mockResolvedValue({ id: '1' }),
    remove: jest.fn().mockResolvedValue(null),
    categories: jest.fn().mockResolvedValue({ expenseAmount: '0', list: [] }),
  }
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ExpenseProjectController],
      providers: [{ provide: ExpenseProjectService, useValue: service }],
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
      .get('/expense-projects/options')
      .expect(200)
    expect(response.body).toContain('folder')
    expect(service.options).toHaveBeenCalled()
  })
  it('列表状态与用户从请求上下文传入', async () => {
    await request(app.getHttpServer() as Server)
      .get('/expense-projects?status=all')
      .expect(200)
    expect(service.list).toHaveBeenCalledWith(14, 'all')
    await request(app.getHttpServer() as Server)
      .get('/expense-projects?status=bad')
      .expect(400)
  })
  it.each(['0', 'abc', '-1', '01', '18446744073709551616'])(
    '非法项目ID %s 返回400',
    async (id) => {
      await request(app.getHttpServer() as Server)
        .get('/expense-projects/' + id)
        .expect(400)
    },
  )
  it('详情限定当前用户并保持字符串ID', async () => {
    await request(app.getHttpServer() as Server)
      .get('/expense-projects/9007199254740993')
      .expect(200)
    expect(service.get).toHaveBeenCalledWith(14, '9007199254740993')
  })
  it('创建、清空日期、归档、删除与分类下钻', async () => {
    await request(app.getHttpServer() as Server)
      .post('/expense-projects')
      .send({ name: '  旅行  ' })
      .expect(201)
    expect(service.create).toHaveBeenCalledWith(
      14,
      expect.objectContaining({ name: '旅行' }),
    )
    await request(app.getHttpServer() as Server)
      .patch('/expense-projects/1')
      .send({ startDate: null, endDate: null, isArchived: true })
      .expect(200)
    expect(service.update).toHaveBeenCalledWith(
      14,
      '1',
      expect.objectContaining({
        startDate: null,
        endDate: null,
        isArchived: true,
      }),
    )
    await request(app.getHttpServer() as Server)
      .delete('/expense-projects/1')
      .expect(200)
    expect(service.remove).toHaveBeenCalledWith(14, '1')
    await request(app.getHttpServer() as Server)
      .get('/expense-projects/1/categories?parentCategoryId=2')
      .expect(200)
    expect(service.categories).toHaveBeenCalledWith(14, '1', '2')
  })
  it('拒绝空名称和非法下钻ID', async () => {
    await request(app.getHttpServer() as Server)
      .post('/expense-projects')
      .send({ name: ' ' })
      .expect(400)
    await request(app.getHttpServer() as Server)
      .get('/expense-projects/1/categories?parentCategoryId=abc')
      .expect(400)
  })
})
