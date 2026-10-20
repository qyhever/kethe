import { Transform } from 'class-transformer'
import { IsIn, IsString, Length } from 'class-validator'
import { PartialType } from '@nestjs/mapped-types'
import { MEMBER_ICONS } from '../../user/member-options'
export class CreateMemberDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 12)
  name!: string

  @IsIn(MEMBER_ICONS)
  iconKey!: string
}
export class UpdateMemberDto extends PartialType(CreateMemberDto, {
  skipNullProperties: false,
}) {}
