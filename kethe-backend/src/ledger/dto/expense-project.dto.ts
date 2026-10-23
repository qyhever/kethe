import { PartialType } from '@nestjs/mapped-types'
import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator'
export const EXPENSE_PROJECT_ICONS = [
  'folder',
  'plane',
  'luggage',
  'house',
  'hammer',
  'heart',
  'gift',
  'shopping-bag',
] as const
export class CreateExpenseProjectDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 30)
  name!: string
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsIn(EXPENSE_PROJECT_ICONS)
  iconKey?: string
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  startDate?: string | null
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  endDate?: string | null
  @IsOptional() @IsString() @MaxLength(500) remark?: string | null
}
export class UpdateExpenseProjectDto extends PartialType(
  CreateExpenseProjectDto,
  { skipNullProperties: false },
) {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsBoolean()
  isArchived?: boolean
}
export class ExpenseProjectQueryDto {
  @IsOptional() @IsIn(['active', 'archived', 'all']) status?:
    'active' | 'archived' | 'all'
}
export class ExpenseProjectCategoriesDto {
  @IsOptional() @Matches(/^[1-9]\d*$/) parentCategoryId?: string
}
