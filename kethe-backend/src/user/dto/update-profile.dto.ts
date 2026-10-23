import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsString, ValidateBy, ValidateIf } from 'class-validator'

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: '昵称，去除首尾空白后 1–50 个 Unicode 码点',
    maxLength: 50,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ValidateIf((_: unknown, value: unknown) => value !== undefined)
  @IsString()
  @ValidateBy({
    name: 'unicodeCodePointLength',
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' &&
        [...value].length >= 1 &&
        [...value].length <= 50,
      defaultMessage: () => '字段长度须为 1–50 个 Unicode 码点',
    },
  })
  nickname?: string

  @ApiPropertyOptional({
    description: '用户名，去除首尾空白后 1–50 个 Unicode 码点',
    maxLength: 50,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @ValidateIf((_: unknown, value: unknown) => value !== undefined)
  @IsString()
  @ValidateBy({
    name: 'unicodeCodePointLength',
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' &&
        [...value].length >= 1 &&
        [...value].length <= 50,
      defaultMessage: () => '字段长度须为 1–50 个 Unicode 码点',
    },
  })
  username?: string
}
