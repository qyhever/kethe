import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import nodemailer, { type Transporter } from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import { ResponseMessageEnum } from '../common/enums/response-message.enum'
import type { EnvironmentVariables } from '../config/environment.validation'

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
  ): Promise<void> {
    await this.send({
      from: this.from,
      to: email,
      subject: '注册邮箱验证码',
      text: `您的注册验证码是 ${code}，${validMinutes} 分钟内有效。请勿将验证码告知他人。`,
      html: this.renderVerificationCodeHtml(code, validMinutes),
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
  ): string {
    return verificationCodeHtmlTemplate
      .replace('{{CODE}}', code)
      .replace('{{VALID_MINUTES}}', validMinutes.toString())
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
