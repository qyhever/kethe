import { Logger, ValidationPipe, type INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import request from 'supertest'
import type { App } from 'supertest/types'
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard'
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter'
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor'
import { Feedback } from '../src/feedback/entities/feedback.entity'
import { FeedbackController } from '../src/feedback/feedback.controller'
import { FeedbackService } from '../src/feedback/feedback.service'

describe('Feedback (e2e)', () => {
  let app: INestApplication<App>
  let jwt: JwtService
  let token: string
  const repository = {
    create: jest.fn<Feedback, [Partial<Feedback>]>(),
    save: jest.fn<Promise<Feedback>, [Feedback]>(),
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'feedback-test-secret',
          signOptions: { issuer: 'kethe-test' },
        }),
      ],
      controllers: [FeedbackController],
      providers: [
        FeedbackService,
        { provide: getRepositoryToken(Feedback), useValue: repository },
        {
          provide: ConfigService,
          useValue: { get: () => 'kethe-test' },
        },
        { provide: APP_GUARD, useClass: AccessTokenGuard },
      ],
    }).compile()
    jwt = module.get(JwtService)
    token = jwt.sign({ sub: 42, type: 'access' })
    app = module.createNestApplication()
    app.setGlobalPrefix('/api')
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    )
    app.useGlobalInterceptors(new ResponseInterceptor())
    app.useGlobalFilters(new GlobalExceptionFilter())
    await app.init()
  })

  beforeEach(() => {
    jest.resetAllMocks()
    repository.create.mockImplementation((data) =>
      Object.assign(new Feedback(), data),
    )
    repository.save.mockImplementation((feedback) =>
      Promise.resolve(Object.assign(feedback, { id: 9 })),
    )
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined)
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => jest.restoreAllMocks())
  afterAll(async () => app.close())

  const submit = (body: Record<string, unknown>, authorization = token) =>
    request(app.getHttpServer())
      .post('/api/feedbacks')
      .set('Authorization', `Bearer ${authorization}`)
      .send(body)

  it.each([
    '建议',
    '😀',
    '中'.repeat(1000),
    '😀'.repeat(1000),
    '中😀'.repeat(500),
  ])('接受中文及 emoji 长度边界（%#.）', async (content) => {
    await submit({ content: ` \t${content}\n ` })
      .expect(201)
      .expect({ success: true, data: { id: 9 }, message: '请求成功' })
    expect(repository.create).toHaveBeenCalledWith({ userId: 42, content })
    expect(repository.save).toHaveBeenCalledTimes(1)
  })

  it.each([
    {},
    { content: null },
    { content: 123 },
    { content: ['建议'] },
    { content: {} },
    { content: '' },
    { content: ' \t\n\u3000' },
    { content: '中'.repeat(1001) },
    { content: '😀'.repeat(1001) },
    { content: '建议', userId: 99 },
    { content: '建议', extra: true },
  ])('拒绝非法请求体（%#.）', async (body) => {
    await submit(body)
      .expect(200)
      .expect(({ body: response }: { body: Record<string, unknown> }) => {
        expect(response).toMatchObject({ success: false, data: null })
        expect(response.message).toEqual(expect.any(String))
      })
    expect(repository.save).not.toHaveBeenCalled()
  })

  it('用户归属取自访问令牌', async () => {
    await submit(
      { content: '另一位用户的反馈' },
      jwt.sign({ sub: 86, type: 'access' }),
    ).expect(201)
    expect(repository.create).toHaveBeenCalledWith({
      userId: 86,
      content: '另一位用户的反馈',
    })
  })

  it('拒绝未登录、无效、过期及刷新令牌', async () => {
    await request(app.getHttpServer())
      .post('/api/feedbacks')
      .send({ content: '建议' })
      .expect(401)
    for (const invalid of [
      'invalid-token',
      jwt.sign({ sub: 42, type: 'access' }, { expiresIn: -1 }),
      jwt.sign({ sub: 42, type: 'refresh' }),
    ]) {
      await submit({ content: '建议' }, invalid).expect(401)
    }
    expect(repository.save).not.toHaveBeenCalled()
  })

  it('数据库失败时返回统一错误，不暴露内部信息', async () => {
    repository.save.mockRejectedValue(new Error('sensitive database details'))
    await submit({ content: '建议' })
      .expect(500)
      .expect({ success: false, data: null, message: '服务器内部错误' })
  })
})
