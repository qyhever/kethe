import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator'

export class ResetPasswordDto {
  @ApiProperty({
    description: '注册邮箱。服务端会去除首尾空格并转为小写',
    example: 'user@example.com',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @IsNotEmpty()
  email!: string

  @ApiProperty({
    description: '重置密码验证码，必须为 6 位数字',
    example: '123456',
  })
  @IsString()
  @Matches(/^\d{6}$/)
  verificationCode!: string

  @ApiProperty({ description: '新密码', example: 'new-password123' })
  @IsString()
  @IsNotEmpty()
  newPassword!: string
}
