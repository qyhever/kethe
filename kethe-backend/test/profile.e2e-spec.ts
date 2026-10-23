import {
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common'
import { APP_GUARD, Reflector } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { DataSource } from 'typeorm'
import request from 'supertest'
import { App } from 'supertest/types'
import { AccessTokenGuard } from '../src/auth/guards/access-token.guard'
import { UserController } from '../src/user/user.controller'
import { UserService } from '../src/user/user.service'
import { UserRepository } from '../src/user/repositories/user.repository'
import { User } from '../src/user/entities/user.entity'
import { DefaultUserDataService } from '../src/user/default-user-data.service'
import { AttachService } from '../src/attach/attach.service'
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor'
import { imageFixtures } from './fixtures/profile-images'

describe('个人资料接口 (e2e)', () => {
  let app: INestApplication<App>
  const repository = {
    findById: jest.fn(),
    existsByUsername: jest.fn(),
    save: jest.fn(),
  }
  const attach = { upload: jest.fn() }
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        { provide: UserRepository, useValue: repository },
        { provide: AttachService, useValue: attach },
        { provide: DataSource, useValue: {} },
        { provide: DefaultUserDataService, useValue: {} },
        { provide: ConfigService, useValue: { get: () => 'test' } },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: (token: string) =>
              token === 'valid'
                ? Promise.resolve({ sub: 7, type: 'access' })
                : Promise.reject(new Error('invalid')),
          },
        },
        { provide: APP_GUARD, useClass: AccessTokenGuard },
      ],
    }).compile()
    app = module.createNestApplication()
    app.setGlobalPrefix('/api')
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    )
    app.useGlobalInterceptors(
      new ResponseInterceptor(),
      new ClassSerializerInterceptor(module.get(Reflector)),
    )
    await app.init()
  })
  beforeEach(() => {
    jest.clearAllMocks()
    repository.findById.mockResolvedValue(
      Object.assign(new User(), {
        id: 7,
        nickname: '原昵称',
        username: 'original',
        isEnabled: true,
        isSystemDefault: false,
        password: 'hidden',
      }),
    )
    repository.existsByUsername.mockResolvedValue(false)
    repository.save.mockImplementation((user: User) => Promise.resolve(user))
    attach.upload.mockResolvedValue({ url: '/avatar.png' })
  })
  afterAll(async () => {
    await app.close()
  })

  it.each(['/api/user/me', '/api/user/me/avatar'])(
    '修改接口需要认证：%s',
    async (path) => {
      const req = path.endsWith('avatar')
        ? request(app.getHttpServer()).post(path)
        : request(app.getHttpServer()).patch(path)
      await req.expect(401)
      expect(repository.save).not.toHaveBeenCalled()
    },
  )
  it('令牌决定用户归属，响应包装且排除密码', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/user/me')
      .auth('valid', { type: 'bearer' })
      .send({ nickname: '  😀中文  ' })
      .expect(200)
    expect(response.body).toEqual({
      success: true,
      message: '更新成功',
      // Jest asymmetric matcher deliberately returns any.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: expect.objectContaining({ id: 7, nickname: '😀中文' }),
    })
    const body = response.body as { data: { avatar?: string } }
    expect(body.data).not.toHaveProperty('password')
    expect(repository.findById).toHaveBeenCalledWith(7)
  })
  it.each([
    {},
    { nickname: null },
    { username: 123 },
    { nickname: '  ' },
    { nickname: '😀'.repeat(51) },
    { id: 99, nickname: '昵称' },
    { email: 'x@example.com' },
    { password: 'bad' },
    { isEnabled: false },
  ])('拒绝非法或越权请求：%o', async (body) => {
    await request(app.getHttpServer())
      .patch('/api/user/me')
      .auth('valid', { type: 'bearer' })
      .send(body)
      .expect(400)
    expect(repository.save).not.toHaveBeenCalled()
  })
  it.each(Object.entries(imageFixtures))(
    '接收真实图片：%s',
    async (contentType, buffer) => {
      const response = await request(app.getHttpServer())
        .post('/api/user/me/avatar')
        .auth('valid', { type: 'bearer' })
        .attach('file', buffer, { filename: 'avatar.image', contentType })
        .expect(200)
      const body = response.body as { data: { avatar: string } }
      expect(body.data.avatar).toBe('/avatar.png')
      expect(body.data).not.toHaveProperty('password')
    },
  )
  it('恰好 5 MiB 可以上传', async () => {
    const buffer = Buffer.alloc(5 * 1024 * 1024)
    imageFixtures['image/png'].copy(buffer)
    await request(app.getHttpServer())
      .post('/api/user/me/avatar')
      .auth('valid', { type: 'bearer' })
      .attach('file', buffer, { filename: 'a.png', contentType: 'image/png' })
      .expect(200)
  })
  it('拒绝超过 5 MiB 的上传', async () => {
    await request(app.getHttpServer())
      .post('/api/user/me/avatar')
      .auth('valid', { type: 'bearer' })
      .attach('file', Buffer.alloc(5 * 1024 * 1024 + 1), {
        filename: 'a.png',
        contentType: 'image/png',
      })
      .expect(413)
    expect(attach.upload).not.toHaveBeenCalled()
  })
  it.each([
    Buffer.alloc(0),
    Buffer.from('not an image'),
    imageFixtures['image/jpeg'],
  ])('拒绝空图片、伪装格式或 MIME 不一致', async (buffer) => {
    await request(app.getHttpServer())
      .post('/api/user/me/avatar')
      .auth('valid', { type: 'bearer' })
      .attach('file', buffer, { filename: 'a.png', contentType: 'image/png' })
      .expect(400)
    expect(attach.upload).not.toHaveBeenCalled()
  })
  it('拒绝多个文件', async () => {
    await request(app.getHttpServer())
      .post('/api/user/me/avatar')
      .auth('valid', { type: 'bearer' })
      .attach('file', imageFixtures['image/png'], 'a.png')
      .attach('file', imageFixtures['image/png'], 'b.png')
      .expect(400)
  })
})
