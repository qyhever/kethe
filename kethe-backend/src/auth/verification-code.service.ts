import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import { ResponseMessageEnum } from '../common/enums/response-message.enum'
import type { EntityManager } from 'typeorm'
import type { ServiceErrorResult } from '../common/interceptors/response.interceptor'
import type { EnvironmentVariables } from '../config/environment.validation'
import { MailService } from '../mail/mail.service'
import { UserService } from '../user/user.service'
import {
  EmailVerificationCode,
  REGISTRATION_PURPOSE,
  RESET_PASSWORD_PURPOSE,
  type VerificationCodePurpose,
} from './entities/email-verification-code.entity'
import { VerificationCodeRepository } from './repositories/verification-code.repository'

const CODE_VALID_MINUTES = 10
const RESEND_INTERVAL_MS = 60_000
const MAX_FAILED_ATTEMPTS = 5

@Injectable()
export class VerificationCodeService {
  private readonly logger = new Logger(VerificationCodeService.name)

  constructor(
    private readonly repository: VerificationCodeRepository,
    private readonly mailService: MailService,
    private readonly userService: UserService,
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  async sendRegistrationCode(
    rawEmail: string,
  ): Promise<void | ServiceErrorResult> {
    const email = this.normalizeEmail(rawEmail)
    const isRegistered = await this.userService.existsByEmail(email)
    if (isRegistered) {
      return {
        error: true,
        message: ResponseMessageEnum.EMAIL_ALREADY_REGISTERED,
      }
    }

    return this.sendCode(email, REGISTRATION_PURPOSE)
  }

  async sendPasswordResetCode(rawEmail: string): Promise<void> {
    const email = this.normalizeEmail(rawEmail)

    try {
      const isRegistered = await this.userService.existsByEmail(email)
      if (!isRegistered) {
        this.logger.warn(`忽略未注册邮箱的密码重置验证码请求：${email}`)
        return
      }

      const result = await this.sendCode(email, RESET_PASSWORD_PURPOSE)
      if (result) {
        this.logger.warn(`密码重置验证码请求未发送：${result.message}`)
      }
    } catch (error) {
      this.logger.error(
        '处理密码重置验证码请求失败',
        error instanceof Error ? error.stack : undefined,
      )
    }
  }

  private async sendCode(
    email: string,
    purpose: VerificationCodePurpose,
  ): Promise<void | ServiceErrorResult> {
    const current = await this.repository.getCurrent(email, purpose)
    const now = new Date()
    if (
      current &&
      !current.consumedAt &&
      now.getTime() - current.sentAt.getTime() < RESEND_INTERVAL_MS
    ) {
      return {
        error: true,
        message: ResponseMessageEnum.VERIFICATION_CODE_SENT_TOO_FREQUENTLY,
      }
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0')
    await this.repository.saveLatest({
      email,
      purpose,
      codeHash: this.hashCode(email, purpose, code),
      sentAt: now,
      expiresAt: new Date(now.getTime() + CODE_VALID_MINUTES * 60_000),
    })

    try {
      await this.mailService.sendVerificationCode(
        email,
        code,
        CODE_VALID_MINUTES,
        purpose,
      )
    } catch (error) {
      this.logger.error(
        `发送${purpose === REGISTRATION_PURPOSE ? '注册' : '重置密码'}验证码邮件失败`,
        error instanceof Error ? error.stack : undefined,
      )
      await this.repository.invalidate(email, purpose)
      return {
        error: true,
        message: ResponseMessageEnum.VERIFICATION_CODE_EMAIL_SEND_FAILED,
      }
    }
  }

  async verifyRegistrationCode(
    rawEmail: string,
    code: string,
    manager: EntityManager,
  ): Promise<EmailVerificationCode | ServiceErrorResult> {
    return this.verifyCode(rawEmail, code, REGISTRATION_PURPOSE, manager)
  }

  verifyPasswordResetCode(
    rawEmail: string,
    code: string,
    manager: EntityManager,
  ): Promise<EmailVerificationCode | ServiceErrorResult> {
    return this.verifyCode(rawEmail, code, RESET_PASSWORD_PURPOSE, manager)
  }

  private async verifyCode(
    rawEmail: string,
    code: string,
    purpose: VerificationCodePurpose,
    manager: EntityManager,
  ): Promise<EmailVerificationCode | ServiceErrorResult> {
    const email = this.normalizeEmail(rawEmail)
    const current = await this.repository.getCurrent(
      email,
      purpose,
      manager,
      true,
    )

    if (
      !current ||
      current.consumedAt ||
      current.expiresAt.getTime() <= Date.now() ||
      current.failedAttempts >= MAX_FAILED_ATTEMPTS
    ) {
      return {
        error: true,
        message: ResponseMessageEnum.VERIFICATION_CODE_INVALID_OR_EXPIRED,
      }
    }

    const actualHash = Buffer.from(this.hashCode(email, purpose, code), 'hex')
    const expectedHash = Buffer.from(current.codeHash, 'hex')
    if (
      actualHash.length !== expectedHash.length ||
      !timingSafeEqual(actualHash, expectedHash)
    ) {
      await this.repository.recordFailure(current, manager)
      return {
        error: true,
        message: ResponseMessageEnum.VERIFICATION_CODE_INCORRECT,
      }
    }

    return current
  }

  consume(
    verificationCode: EmailVerificationCode,
    manager: EntityManager,
  ): Promise<void> {
    return this.repository.consume(verificationCode, manager)
  }

  normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
  }

  hashCode(
    email: string,
    purpose: VerificationCodePurpose,
    code: string,
  ): string {
    const secret = this.configService.get('EMAIL_VERIFICATION_SECRET', {
      infer: true,
    })
    return createHmac('sha256', secret)
      .update(`${this.normalizeEmail(email)}:${purpose}:${code}`)
      .digest('hex')
  }
}
