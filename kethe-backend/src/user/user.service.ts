import {
  BadRequestException,
  FileTypeValidator,
  Injectable,
} from '@nestjs/common'
import { AttachService } from '../attach/attach.service'
import type { AttachUploadFile } from '../attach/attach.types'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { ConfigService } from '@nestjs/config'
import { hash } from 'bcryptjs'
import { DataSource, type EntityManager } from 'typeorm'
import { ResponseMessageEnum } from '../common/enums/response-message.enum'
import type { ServiceErrorResult } from '../common/interceptors/response.interceptor'
import type { EnvironmentVariables } from '../config/environment.validation'
import { CreateUserDto } from './dto/create-user.dto'
import { BatchDeleteUsersDto } from './dto/batch-delete-users.dto'
import { FindUsersPageDto } from './dto/find-users-page.dto'
import { UserPageResultDto } from './dto/user-page-result.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { User } from './entities/user.entity'
import { UserRepository } from './repositories/user.repository'
import type { BatchDeleteUsersResult } from './types/batch-delete-users-result'
import { DefaultUserDataService } from './default-user-data.service'

@Injectable()
export class UserService {
  constructor(
    private readonly attachService: AttachService,
    private readonly dataSource: DataSource,
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
    private readonly defaultUserDataService: DefaultUserDataService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<User | ServiceErrorResult> {
    return this.dataSource.transaction(async (manager) => {
      const [usernameExists, emailExists] = await Promise.all([
        this.userRepository.existsByUsername(createUserDto.username, manager),
        this.userRepository.existsByEmail(createUserDto.email, manager),
      ])

      if (usernameExists) {
        return {
          error: true as const,
          message: ResponseMessageEnum.USERNAME_ALREADY_EXISTS,
        }
      }

      if (emailExists) {
        return {
          error: true as const,
          message: ResponseMessageEnum.EMAIL_ALREADY_EXISTS,
        }
      }

      const bcryptRounds = this.configService.get('BCRYPT_ROUNDS', {
        infer: true,
      })
      const password = await hash(createUserDto.password, bcryptRounds)
      const user = this.userRepository.create(
        {
          ...createUserDto,
          password,
        },
        manager,
      )
      const savedUser = await this.userRepository.save(user, manager)
      await this.defaultUserDataService.initialize(savedUser.id, manager)

      return savedUser
    })
  }

  existsByEmail(email: string, manager?: EntityManager): Promise<boolean> {
    return this.userRepository.existsByEmail(email, manager)
  }

  findLoginUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findLoginUserByEmail(email)
  }

  findPasswordUserByEmail(
    email: string,
    manager?: EntityManager,
  ): Promise<User | null> {
    return this.userRepository.findPasswordUserByEmail(email, manager)
  }

  findPasswordUserById(
    id: number,
    manager?: EntityManager,
  ): Promise<User | null> {
    return this.userRepository.findPasswordUserById(id, manager)
  }

  async savePassword(
    user: User,
    password: string,
    manager?: EntityManager,
  ): Promise<void> {
    const bcryptRounds = this.configService.get('BCRYPT_ROUNDS', {
      infer: true,
    })
    user.password = await hash(password, bcryptRounds)
    await this.userRepository.save(user, manager)
  }

  existsByUsername(
    username: string,
    manager?: EntityManager,
  ): Promise<boolean> {
    return this.userRepository.existsByUsername(username, manager)
  }

  async createRegistrationUser(
    data: {
      username: string
      nickname: string
      email: string
      password: string
    },
    manager: EntityManager,
  ): Promise<User> {
    const bcryptRounds = this.configService.get('BCRYPT_ROUNDS', {
      infer: true,
    })
    const password = await hash(data.password, bcryptRounds)
    const user = this.userRepository.create({ ...data, password }, manager)
    return this.userRepository.save(user, manager)
  }

  findAll(): Promise<User[]> {
    return this.userRepository.findAll()
  }

  async findPage(query: FindUsersPageDto): Promise<UserPageResultDto> {
    const normalizedQuery: FindUsersPageDto = {
      currentPage: query.currentPage ?? 1,
      pageSize: query.pageSize ?? 10,
      sortField: query.sortField ?? 'createdAt',
      sortValue: query.sortValue ?? 'desc',
      username: query.username,
      email: query.email,
      nickname: query.nickname,
      dataType:
        query.rangeDate?.length && !query.dataType
          ? 'createdAt'
          : query.dataType,
      rangeDate: query.rangeDate ?? [],
    }
    const { list, total } = await this.userRepository.findPage(normalizedQuery)

    return {
      list,
      total,
      currentPage: normalizedQuery.currentPage,
      pageSize: normalizedQuery.pageSize,
    }
  }

  async findOne(id: number): Promise<User | ServiceErrorResult> {
    const user = await this.userRepository.findById(id)

    if (!user) {
      return {
        error: true,
        message: ResponseMessageEnum.USER_NOT_FOUND,
      }
    }

    if (user.deletedAt) {
      return {
        error: true,
        message: ResponseMessageEnum.USER_NOT_FOUND,
      }
    }

    return user
  }

  private async editableUser(id: number): Promise<User | ServiceErrorResult> {
    const user = await this.userRepository.findById(id)
    if (!user || user.deletedAt)
      return { error: true, message: ResponseMessageEnum.USER_NOT_FOUND }
    if (!user.isEnabled)
      return { error: true, message: ResponseMessageEnum.USER_DISABLED }
    if (user.isSystemDefault)
      return {
        error: true,
        message: ResponseMessageEnum.SYSTEM_DEFAULT_USER_CANNOT_BE_MODIFIED,
      }
    return user
  }

  async updateProfile(
    id: number,
    dto: UpdateProfileDto,
  ): Promise<User | ServiceErrorResult> {
    if (dto.nickname === undefined && dto.username === undefined)
      throw new BadRequestException('至少提供昵称或用户名')
    const user = await this.editableUser(id)
    if ('error' in user) return user
    const username = dto.username?.trim()
    const nickname = dto.nickname?.trim()
    for (const value of [username, nickname]) {
      if (
        value !== undefined &&
        ([...value].length < 1 || [...value].length > 50)
      )
        throw new BadRequestException('昵称和用户名须为 1–50 个字符')
    }
    if (username === undefined || username === user.username) {
      if (nickname === undefined || nickname === user.nickname) return user
    } else if (await this.userRepository.existsByUsername(username)) {
      return {
        error: true,
        message: ResponseMessageEnum.USERNAME_ALREADY_EXISTS,
      }
    }
    const updated = Object.assign(new User(), user, {
      username: username ?? user.username,
      nickname: nickname ?? user.nickname,
    })
    try {
      return await this.userRepository.save(updated)
    } catch (error) {
      const databaseError = error as {
        code?: string
        driverError?: { code?: string }
      }
      if (
        databaseError.code === 'ER_DUP_ENTRY' ||
        databaseError.driverError?.code === 'ER_DUP_ENTRY'
      )
        return {
          error: true,
          message: ResponseMessageEnum.USERNAME_ALREADY_EXISTS,
        }
      throw error
    }
  }

  async updateAvatar(
    id: number,
    file?: AttachUploadFile & { mimetype: string },
  ): Promise<User | ServiceErrorResult> {
    const user = await this.editableUser(id)
    if ('error' in user) return user
    if (!file || !Buffer.isBuffer(file.buffer) || !file.buffer.length)
      throw new BadRequestException('必须提供非空图片')
    if (file.buffer.length > 5 * 1024 * 1024)
      throw new BadRequestException('头像不能超过 5 MiB')
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    }
    const extension = extensions[file.mimetype]
    if (
      !extension ||
      !(await new FileTypeValidator({ fileType: file.mimetype }).isValid({
        ...file,
        size: file.buffer.length,
      }))
    )
      throw new BadRequestException(
        '仅支持内容与格式一致的 JPG、PNG、WebP 图片',
      )
    const uploaded = await this.attachService.upload({
      ...file,
      originalname: 'avatar.' + extension,
    })
    if (uploaded.url.length > 255)
      throw new BadRequestException('头像地址超过长度限制')
    return this.userRepository.save(
      Object.assign(new User(), user, { avatar: uploaded.url }),
    )
  }

  async update(
    updateUserDto: UpdateUserDto,
  ): Promise<null | ServiceErrorResult> {
    const user = await this.userRepository.findById(updateUserDto.id)

    if (!user || user.deletedAt) {
      return {
        error: true,
        message: ResponseMessageEnum.USER_NOT_FOUND,
      }
    }

    if (user.isSystemDefault) {
      return {
        error: true,
        message: ResponseMessageEnum.SYSTEM_DEFAULT_USER_CANNOT_BE_MODIFIED,
      }
    }

    const { username, email, password, nickname, avatar, isEnabled } =
      updateUserDto
    const usernameChanged = username !== undefined && username !== user.username
    const emailChanged = email !== undefined && email !== user.email

    const [usernameExists, emailExists] = await Promise.all([
      usernameChanged
        ? this.userRepository.existsByUsername(username)
        : Promise.resolve(false),
      emailChanged
        ? this.userRepository.existsByEmail(email)
        : Promise.resolve(false),
    ])

    if (usernameExists) {
      return {
        error: true,
        message: ResponseMessageEnum.USERNAME_ALREADY_EXISTS,
      }
    }

    if (emailExists) {
      return {
        error: true,
        message: ResponseMessageEnum.EMAIL_ALREADY_EXISTS,
      }
    }

    let changed = false
    const assignIfChanged = <Key extends keyof User>(
      key: Key,
      value: User[Key] | undefined,
    ): void => {
      if (value !== undefined && value !== user[key]) {
        user[key] = value
        changed = true
      }
    }

    assignIfChanged('username', username)
    assignIfChanged('email', email)
    assignIfChanged('nickname', nickname)
    assignIfChanged('avatar', avatar)
    assignIfChanged('isEnabled', isEnabled)

    if (password !== undefined) {
      const bcryptRounds = this.configService.get('BCRYPT_ROUNDS', {
        infer: true,
      })
      user.password = await hash(password, bcryptRounds)
      changed = true
    }

    if (!changed) {
      return null
    }

    await this.userRepository.save(user)
    return null
  }

  async remove(id: number): Promise<null | ServiceErrorResult> {
    const user = await this.userRepository.findById(id)

    if (!user || user.deletedAt) {
      return {
        error: true,
        message: ResponseMessageEnum.USER_NOT_FOUND,
      }
    }

    if (user.isSystemDefault) {
      return {
        error: true,
        message: ResponseMessageEnum.SYSTEM_DEFAULT_USER_CANNOT_BE_DELETED,
      }
    }

    await this.userRepository.softRemove(user)
    return null
  }

  async batchDelete(
    batchDeleteUsersDto: BatchDeleteUsersDto,
  ): Promise<BatchDeleteUsersResult> {
    const users = await this.userRepository.findByIds(batchDeleteUsersDto.ids)
    const usersById = new Map(users.map((user) => [user.id, user]))
    const deletableUsers: User[] = []
    const skipped: BatchDeleteUsersResult['skipped'] = []

    for (const id of batchDeleteUsersDto.ids) {
      const user = usersById.get(id)

      if (!user || user.deletedAt) {
        skipped.push({ id, reason: ResponseMessageEnum.USER_NOT_FOUND })
      } else if (user.isSystemDefault) {
        skipped.push({
          id,
          reason: ResponseMessageEnum.SYSTEM_DEFAULT_USER_CANNOT_BE_DELETED,
        })
      } else {
        deletableUsers.push(user)
      }
    }

    const deletedUsers = deletableUsers.length
      ? await this.userRepository.softRemoveMany(deletableUsers)
      : []

    return {
      deletedIds: deletedUsers.map((user) => user.id),
      skipped,
    }
  }
}
