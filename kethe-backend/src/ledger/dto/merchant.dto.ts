import { PartialType } from '@nestjs/mapped-types'
import { Transform } from 'class-transformer'
import { IsIn, IsString, Length, ValidateIf } from 'class-validator'
export const MERCHANT_ICONS = [
  'store',
  'shopping-cart',
  'shopping-bag',
  'package',
  'globe',
  'gift',
  'tags',
  'building',
] as const
export class CreateMerchantDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 30)
  name!: string
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsIn(MERCHANT_ICONS)
  iconKey?: string
}
export class UpdateMerchantDto extends PartialType(CreateMerchantDto, {
  skipNullProperties: false,
}) {}
