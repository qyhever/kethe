import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { compare } from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { DataSource } from 'typeorm'
import { ResponseMessageEnum } from '../common/enums/response-message.enum'
import type { ServiceErrorResult } from '../common/interceptors/response.interceptor'
import type { EnvironmentVariables } from '../config/environment.validation'
import { UserService } from '../user/user.service'
import { DefaultUserDataService } from '../user/default-user-data.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { VerificationCodeService } from './verification-code.service'

import { AuthSessionService, isSessionId } from './auth-session.service'

export interface LoginSuccessNotificationContext {
  email: string
  event: 'user_login'
  ip?: string
  message: string
  requestId: string
  userAgent?: string
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
    private readonly defaultUserDataService: DefaultUserDataService,
    private readonly verificationCodeService: VerificationCodeService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
    private readonly sessions: AuthSessionService,
  ) {}

  async login(
    dto: LoginDto,
    userAgent?: string,
  ): Promise<
    { accessToken: string; refreshToken: string } | ServiceErrorResult
  > {
    const user = await this.userService.findLoginUserByEmail(dto.email)

    if (!user) {
      return {
        error: true,
        message: ResponseMessageEnum.USER_NOT_FOUND,
      }
    }

    if (!user.isEnabled) {
      throw new ForbiddenException(ResponseMessageEnum.USER_DISABLED)
    }

    if (!(await compare(dto.password, user.password))) {
      return {
        error: true,
        message: ResponseMessageEnum.PASSWORD_INCORRECT,
      }
    }

    const sid = randomUUID()
    const { tokens, refreshJti, expiresAt } = await this.issueTokens(
      user.id,
      sid,
    )
    await this.sessions.create(sid, user.id, refreshJti, expiresAt, userAgent)
    return tokens
  }

  async notifyLoginSuccess(
    context: LoginSuccessNotificationContext,
  ): Promise<void> {
    try {
      const webhookUrl = new URL(
        this.configService.get('WX_WORK_WEBHOOK_SEND_URL', { infer: true }),
      )
      webhookUrl.searchParams.set(
        'key',
        this.configService.get('WX_WORK_WEBHOOK_SEND_KEY', { infer: true }),
      )

      const content = [
        context.message,
        `邮箱：${context.email}`,
        `事件：${context.event}`,
        `IP：${context.ip ?? '未知'}`,
        `请求 ID：${context.requestId}`,
        `User-Agent：${context.userAgent ?? '未知'}`,
      ].join('\n')

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ msgtype: 'text', text: { content } }),
        signal: AbortSignal.timeout(5000),
      })

      if (!response.ok) {
        this.logger.error(
          `企业微信登录通知发送失败：HTTP 状态码 ${response.status}`,
        )
        return
      }

      let responseBody: unknown
      try {
        responseBody = await response.json()
      } catch {
        this.logger.error('企业微信登录通知发送失败：响应不是有效 JSON')
        return
      }

      if (
        typeof responseBody !== 'object' ||
        responseBody === null ||
        typeof (responseBody as Record<string, unknown>).errcode !== 'number'
      ) {
        this.logger.error('企业微信登录通知发送失败：响应格式无效')
        return
      }

      const errcode = (responseBody as { errcode: number }).errcode
      if (errcode !== 0) {
        this.logger.error(`企业微信登录通知发送失败：业务错误码 ${errcode}`)
      }
    } catch (error) {
      const errorName =
        error instanceof DOMException || error instanceof Error
          ? error.name
          : undefined
      const isTimeout =
        errorName === 'AbortError' || errorName === 'TimeoutError'
      this.logger.error(
        `企业微信登录通知发送失败：${isTimeout ? '请求超时' : '网络请求异常'}`,
      )
    }
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let payload: unknown

    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        issuer: this.configService.get('JWT_ISSUER', { infer: true }),
      })
    } catch {
      throw new UnauthorizedException(
        ResponseMessageEnum.REFRESH_TOKEN_INVALID_OR_EXPIRED,
      )
    }

    if (!this.isRefreshTokenPayload(payload)) {
      throw new UnauthorizedException(
        ResponseMessageEnum.REFRESH_TOKEN_INVALID_OR_EXPIRED,
      )
    }

    const user = await this.userService.findOne(payload.sub)

    if ('error' in user) {
      throw new UnauthorizedException(
        ResponseMessageEnum.REFRESH_TOKEN_INVALID_OR_EXPIRED,
      )
    }

    if (!user.isEnabled) {
      throw new ForbiddenException(ResponseMessageEnum.USER_DISABLED)
    }

    if (payload.sid === undefined) {
      return {
        accessToken: await this.issueAccessToken(
          user.id,
          undefined,
          payload.exp,
        ),
        refreshToken,
      }
    }

    const { tokens, refreshJti, expiresAt } = await this.issueTokens(
      user.id,
      payload.sid,
    )
    if (
      !(await this.sessions.rotate(
        user.id,
        payload.sid,
        payload.jti,
        refreshJti,
        expiresAt,
      ))
    ) {
      throw new UnauthorizedException(
        ResponseMessageEnum.REFRESH_TOKEN_INVALID_OR_EXPIRED,
      )
    }
    return tokens
  }

  private async issueAccessToken(
    userId: number,
    sid?: string,
    legacyExpiresAt?: number,
  ) {
    const payload = {
      sub: userId,
      type: 'access',
      jti: randomUUID(),
      ...(sid ? { sid } : {}),
    }
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRE', { infer: true }),
    })
    if (
      legacyExpiresAt !== undefined &&
      this.jwtService.decode<{ exp: number }>(token).exp > legacyExpiresAt
    ) {
      return this.jwtService.signAsync({ ...payload, exp: legacyExpiresAt })
    }
    return token
  }

  private async issueTokens(userId: number, sid: string) {
    const refreshJti = randomUUID()
    const [accessToken, refreshToken] = await Promise.all([
      this.issueAccessToken(userId, sid),
      this.jwtService.signAsync(
        { sub: userId, type: 'refresh', jti: refreshJti, sid },
        {
          expiresIn: this.configService.get('JWT_REFRESH_EXPIRE', {
            infer: true,
          }),
        },
      ),
    ])

    return {
      tokens: { accessToken, refreshToken },
      refreshJti,
      expiresAt: new Date(
        this.jwtService.decode<{ exp: number }>(refreshToken).exp * 1000,
      ),
    }
  }

  private isRefreshTokenPayload(
    payload: unknown,
  ): payload is
    | { sub: number; type: 'refresh'; exp: number; sid?: never }
    | { sub: number; type: 'refresh'; exp: number; sid: string; jti: string } {
    if (typeof payload !== 'object' || payload === null) return false

    const tokenPayload = payload as Record<string, unknown>

    return (
      tokenPayload.type === 'refresh' &&
      typeof tokenPayload.sub === 'number' &&
      Number.isSafeInteger(tokenPayload.sub) &&
      tokenPayload.sub > 0 &&
      typeof tokenPayload.exp === 'number' &&
      Number.isFinite(tokenPayload.exp) &&
      (!('sid' in tokenPayload) ||
        (isSessionId(tokenPayload.sid) && isSessionId(tokenPayload.jti)))
    )
  }

  async register(dto: RegisterDto): Promise<null | ServiceErrorResult> {
    const email = this.verificationCodeService.normalizeEmail(dto.email)

    try {
      return await this.dataSource.transaction(async (manager) => {
        const [usernameExists, emailExists] = await Promise.all([
          this.userService.existsByUsername(dto.username, manager),
          this.userService.existsByEmail(email, manager),
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

        const verificationCode =
          await this.verificationCodeService.verifyRegistrationCode(
            email,
            dto.verificationCode,
            manager,
          )
        if ('error' in verificationCode) return verificationCode

        const user = await this.userService.createRegistrationUser(
          {
            username: dto.username,
            nickname: dto.nickname,
            email,
            password: dto.password,
          },
          manager,
        )
        await this.defaultUserDataService.initialize(user.id, manager)
        await this.verificationCodeService.consume(verificationCode, manager)
        return null
      })
    } catch (error) {
      const databaseError = error as { code?: string; message?: string }
      if (databaseError.code === 'ER_DUP_ENTRY') {
        const isEmail = databaseError.message?.includes('uk_user_email')
        return {
          error: true,
          message: isEmail
            ? ResponseMessageEnum.EMAIL_ALREADY_EXISTS
            : ResponseMessageEnum.USERNAME_ALREADY_EXISTS,
        }
      }
      throw error
    }
  }

  resetPassword(dto: ResetPasswordDto): Promise<null | ServiceErrorResult> {
    const email = this.verificationCodeService.normalizeEmail(dto.email)

    return this.dataSource.transaction(async (manager) => {
      const verificationCode =
        await this.verificationCodeService.verifyPasswordResetCode(
          email,
          dto.verificationCode,
          manager,
        )
      if ('error' in verificationCode) return verificationCode

      const user = await this.userService.findPasswordUserByEmail(
        email,
        manager,
      )
      if (!user) {
        return {
          error: true as const,
          message: ResponseMessageEnum.USER_NOT_FOUND,
        }
      }

      if (await compare(dto.newPassword, user.password)) {
        return {
          error: true as const,
          message: ResponseMessageEnum.NEW_PASSWORD_SAME_AS_OLD,
        }
      }

      await this.userService.savePassword(user, dto.newPassword, manager)
      await this.verificationCodeService.consume(verificationCode, manager)
      return null
    })
  }

  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
  ): Promise<null | ServiceErrorResult> {
    const user = await this.userService.findPasswordUserById(userId)
    if (!user) {
      return {
        error: true,
        message: ResponseMessageEnum.USER_NOT_FOUND,
      }
    }

    if (!(await compare(dto.currentPassword, user.password))) {
      return {
        error: true,
        message: ResponseMessageEnum.CURRENT_PASSWORD_INCORRECT,
      }
    }

    if (await compare(dto.newPassword, user.password)) {
      return {
        error: true,
        message: ResponseMessageEnum.NEW_PASSWORD_SAME_AS_OLD,
      }
    }

    await this.userService.savePassword(user, dto.newPassword)
    return null
  }
}
