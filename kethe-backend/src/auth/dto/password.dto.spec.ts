import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { ChangePasswordDto } from './change-password.dto'
import { ResetPasswordDto } from './reset-password.dto'
import { SendPasswordResetCodeDto } from './send-password-reset-code.dto'

describe('Password DTOs', () => {
  it('应该规范化重置验证码邮箱', async () => {
    const dto = plainToInstance(SendPasswordResetCodeDto, {
      email: ' USER@Example.com ',
    })

    await expect(validate(dto)).resolves.toHaveLength(0)
    expect(dto.email).toBe('user@example.com')
  })

  it.each(['invalid-email', '', 123])('应该拒绝非法邮箱 %p', async (email) => {
    const dto = plainToInstance(SendPasswordResetCodeDto, { email })
    await expect(validate(dto)).resolves.not.toHaveLength(0)
  })

  it.each(['12345', '12345a', '1234567', 123456])(
    '应该拒绝非法重置验证码 %p',
    async (verificationCode) => {
      const dto = plainToInstance(ResetPasswordDto, {
        email: 'user@example.com',
        verificationCode,
        newPassword: 'new-password',
      })
      const errors = await validate(dto)
      expect(
        errors.some((error) => error.property === 'verificationCode'),
      ).toBe(true)
    },
  )

  it.each([
    [
      ResetPasswordDto,
      {
        email: 'user@example.com',
        verificationCode: '123456',
        newPassword: '',
      },
    ],
    [ChangePasswordDto, { currentPassword: '', newPassword: 'new-password' }],
    [ChangePasswordDto, { currentPassword: 'password', newPassword: '' }],
  ])('应该拒绝空密码', async (Dto, payload) => {
    const dto =
      Dto === ResetPasswordDto
        ? plainToInstance(ResetPasswordDto, payload)
        : plainToInstance(ChangePasswordDto, payload)
    await expect(validate(dto)).resolves.not.toHaveLength(0)
  })

  it('应该在启用白名单校验时拒绝额外字段', async () => {
    const dto = plainToInstance(ChangePasswordDto, {
      currentPassword: 'password',
      newPassword: 'new-password',
      unexpected: true,
    })
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    })

    expect(errors.some((error) => error.property === 'unexpected')).toBe(true)
  })
})
