import { BadRequestException } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { ConfigService } from '@nestjs/config'
import { DataSource } from 'typeorm'
import { AttachService } from '../attach/attach.service'
import { UserService } from './user.service'
import { UserRepository } from './repositories/user.repository'
import { User } from './entities/user.entity'
import { DefaultUserDataService } from './default-user-data.service'
import { UpdateProfileDto } from './dto/update-profile.dto'

import { imageFixtures } from '../../test/fixtures/profile-images'

describe('个人资料校验与保存', () => {
  let user: User
  let repository: {
    findById: jest.Mock
    existsByUsername: jest.Mock
    save: jest.Mock
  }
  let attach: { upload: jest.Mock }
  let service: UserService
  beforeEach(() => {
    user = Object.assign(new User(), {
      id: 7,
      username: 'original',
      nickname: '原昵称',
      avatar: '/old.png',
      isEnabled: true,
      isSystemDefault: false,
    })
    repository = {
      findById: jest.fn().mockResolvedValue(user),
      existsByUsername: jest.fn().mockResolvedValue(false),
      save: jest
        .fn()
        .mockImplementation((value: User) => Promise.resolve(value)),
    }
    attach = { upload: jest.fn().mockResolvedValue({ url: '/new.png' }) }
    service = new UserService(
      attach as unknown as AttachService,
      {} as DataSource,
      repository as unknown as UserRepository,
      {} as ConfigService,
      {} as DefaultUserDataService,
    )
  })

  it.each(['中', '😀', '😀'.repeat(50), '  中文 😀  '])(
    '接受 Unicode 字段并去除空白：%s',
    async (value) => {
      const dto = plainToInstance(UpdateProfileDto, { nickname: value })
      expect(await validate(dto)).toHaveLength(0)
      expect(await service.updateProfile(7, dto)).toMatchObject({
        nickname: value.trim(),
      })
    },
  )
  it.each([null, 12, '', '  ', '😀'.repeat(51), '❤️'.repeat(26)])(
    '拒绝非法昵称：%s',
    async (value) => {
      expect(
        (await validate(plainToInstance(UpdateProfileDto, { nickname: value })))
          .length,
      ).toBeGreaterThan(0)
    },
  )
  it('拒绝空更新', async () => {
    await expect(service.updateProfile(7, {})).rejects.toBeInstanceOf(
      BadRequestException,
    )
  })
  it('提交原值不写库', async () => {
    expect(await service.updateProfile(7, { username: 'original' })).toBe(user)
    expect(repository.save).not.toHaveBeenCalled()
  })
  it('拒绝已占用的用户名', async () => {
    repository.existsByUsername.mockResolvedValue(true)
    expect(await service.updateProfile(7, { username: 'taken' })).toEqual({
      error: true,
      message: '用户名已存在',
    })
  })
  it('转换数据库并发唯一冲突', async () => {
    repository.save.mockRejectedValue({ driverError: { code: 'ER_DUP_ENTRY' } })
    expect(await service.updateProfile(7, { username: 'taken' })).toEqual({
      error: true,
      message: '用户名已存在',
    })
    expect(user.username).toBe('original')
  })
  it.each([
    { isEnabled: false },
    { deletedAt: new Date() },
    { isSystemDefault: true },
  ])('不可修改的用户拒绝文本及头像保存：%o', async (state) => {
    Object.assign(user, state)
    expect(
      await service.updateProfile(7, { nickname: '新昵称' }),
    ).toMatchObject({ error: true })
    expect(await service.updateAvatar(7)).toMatchObject({ error: true })
    expect(attach.upload).not.toHaveBeenCalled()
    expect(repository.save).not.toHaveBeenCalled()
  })
  it('用户不存在时拒绝保存', async () => {
    repository.findById.mockResolvedValue(null)
    expect(await service.updateProfile(7, { nickname: '昵称' })).toMatchObject({
      error: true,
    })
  })
  it.each(Object.entries(imageFixtures))(
    '保存真实图片并规范扩展名：%s',
    async (mimetype, buffer) => {
      expect(
        await service.updateAvatar(7, {
          originalname: 'wrong.html',
          mimetype,
          buffer,
        }),
      ).toMatchObject({ avatar: '/new.png' })
      expect(attach.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          originalname:
            mimetype === 'image/jpeg'
              ? 'avatar.jpg'
              : 'avatar.' + mimetype.split('/')[1],
        }),
      )
    },
  )
  it('数据库保存失败保持原头像', async () => {
    repository.save.mockRejectedValue(new Error('database unavailable'))
    await expect(
      service.updateAvatar(7, {
        originalname: 'a.png',
        mimetype: 'image/png',
        buffer: imageFixtures['image/png'],
      }),
    ).rejects.toThrow('database unavailable')
    expect(user.avatar).toBe('/old.png')
  })
  it('拒绝超过 255 字符的头像地址', async () => {
    attach.upload.mockResolvedValue({ url: 'x'.repeat(256) })
    await expect(
      service.updateAvatar(7, {
        originalname: 'a.png',
        mimetype: 'image/png',
        buffer: imageFixtures['image/png'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(repository.save).not.toHaveBeenCalled()
  })
})
