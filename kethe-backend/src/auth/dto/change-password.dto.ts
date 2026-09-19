import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class ChangePasswordDto {
  @ApiProperty({ description: '当前密码', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string

  @ApiProperty({ description: '新密码', example: 'new-password123' })
  @IsString()
  @IsNotEmpty()
  newPassword!: string
}
