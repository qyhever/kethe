import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import nodemailer, { type Transporter } from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import { ResponseMessageEnum } from '../common/enums/response-message.enum'
import type { EnvironmentVariables } from '../config/environment.validation'
import {
  REGISTRATION_PURPOSE,
  type VerificationCodePurpose,
} from '../auth/entities/email-verification-code.entity'

const verificationCodeHtmlTemplate = readFileSync(
  join(__dirname, 'templates', 'verification-code.html'),
  'utf8',
)

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private readonly transporter: Transporter
  private readonly from: string

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {
    const port = this.configService.get('POSTAL_SMTP_PORT', { infer: true })
    const timeout = this.configService.get('POSTAL_SMTP_TIMEOUT_MS', {
      infer: true,
    })
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('POSTAL_SMTP_SERVER', { infer: true }),
      port,
      secure: port === 465,
      connectionTimeout: timeout,
      greetingTimeout: timeout,
      socketTimeout: timeout,
      auth: {
        user: this.configService.get('POSTAL_FROM_EMAIL', { infer: true }),
        pass: this.configService.get('POSTAL_FROM_PASS', { infer: true }),
      },
    })
    const fromEmail = this.configService.get('POSTAL_FROM_EMAIL', {
      infer: true,
    })
    const fromName = this.configService.get('POSTAL_FROM_NAME', { infer: true })
    this.from = `"${fromName.replaceAll('"', '\\"')}" <${fromEmail}>`
  }

  async sendVerificationCode(
    email: string,
    code: string,
    validMinutes: number,
    purpose: VerificationCodePurpose = REGISTRATION_PURPOSE,
  ): Promise<void> {
    const isRegistration = purpose === REGISTRATION_PURPOSE
    const scene = isRegistration ? '注册' : '重置密码'
    await this.send({
      from: this.from,
      to: email,
      subject: isRegistration ? '注册邮箱验证码' : '重置密码验证码',
      text: `您的${scene}验证码是 ${code}，${validMinutes} 分钟内有效。请勿将验证码告知他人。`,
      html: this.renderVerificationCodeHtml(code, validMinutes, scene),
    })
  }

  async sendMail(to: string, subject: string, body: string): Promise<void> {
    await this.send({
      from: this.from,
      to,
      subject,
      text: body,
    })
  }

  private async send(options: Mail.Options): Promise<void> {
    try {
      await this.transporter.sendMail(options)
    } catch (error) {
      this.logger.error(
        {
          message: 'SMTP 邮件发送失败',
          error: error instanceof Error ? error.message : 'Unknown error',
          to: options.to,
          subject: options.subject,
        },
        error instanceof Error ? error.stack : undefined,
      )
      throw new ServiceUnavailableException(
        ResponseMessageEnum.MAIL_SEND_FAILED,
      )
    }
  }

  private renderVerificationCodeHtml(
    code: string,
    validMinutes: number,
    scene: string,
  ): string {
    return verificationCodeHtmlTemplate
      .replace('{{CODE}}', code)
      .replace('{{VALID_MINUTES}}', validMinutes.toString())
      .replaceAll('{{SCENE}}', this.escapeHtml(scene))
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
  }
}
