import { PartialType } from '@nestjs/mapped-types'
import { Transform } from 'class-transformer'
import { IsString, Length, Matches, ValidateIf } from 'class-validator'
export class CreateMerchantDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 30)
  name!: string
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Length(1, 64)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  iconKey?: string
}
export class UpdateMerchantDto extends PartialType(CreateMerchantDto, {
  skipNullProperties: false,
}) {}
