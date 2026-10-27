import { Transform } from 'class-transformer'
import { IsString, Length, Matches } from 'class-validator'
import { PartialType } from '@nestjs/mapped-types'
export class CreateMemberDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 12)
  name!: string

  @IsString()
  @Length(1, 64)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  iconKey!: string
}
export class UpdateMemberDto extends PartialType(CreateMemberDto, {
  skipNullProperties: false,
}) {}
