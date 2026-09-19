import { Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
  ValidateBy,
} from 'class-validator'
import { AccountType } from '../../user/enums/account-type.enum'
import { TransactionType } from '../entities/transaction.entity'

const ID_PATTERN = /^[1-9]\d*$/
const AMOUNT_PATTERN = /^(0|[1-9]\d*)$/
const POSITIVE_AMOUNT_PATTERN = /^[1-9]\d*$/
const ISO_WEEK_PATTERN = /^(\d{4})-W(0[1-9]|[1-4]\d|5[0-3])$/

function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

function isoWeeksInYear(year: number) {
  const januaryFirst = new Date(Date.UTC(year, 0, 1)).getUTCDay() || 7
  return januaryFirst === 4 || (januaryFirst === 3 && isLeapYear(year))
    ? 53
    : 52
}

function IsIsoWeek() {
  return ValidateBy({
    name: 'isIsoWeek',
    validator: {
      validate(value: unknown) {
        if (typeof value !== 'string') return false
        const matched = ISO_WEEK_PATTERN.exec(value)
        if (!matched) return false
        return Number(matched[2]) <= isoWeeksInYear(Number(matched[1]))
      },
      defaultMessage: () => 'week must be a valid ISO week in YYYY-Www format',
    },
  })
}
const toNumber = ({ value }: { value: unknown }): unknown =>
  value === undefined ? undefined : Number(value)
const toBoolean = ({ value }: { value: unknown }): unknown =>
  value === true || value === 'true'
    ? true
    : value === false || value === 'false'
      ? false
      : value

export class CreateCategoryDto {
  @Type(() => Number)
  @IsIn([1, 2])
  categoryType!: number

  @IsOptional()
  @Matches(ID_PATTERN)
  parentId?: string

  @IsString()
  @Length(1, 12)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  remark?: string | null

  @IsOptional()
  @Matches(ID_PATTERN)
  iconId?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number
}

export class CategoryListQueryDto {
  @IsOptional()
  @Transform(toNumber)
  @IsIn([1, 2])
  categoryType?: number
}

export class UpdateCategoryDto {
  @IsOptional()
  @ValidateBy({
    name: 'isNullablePositiveId',
    validator: {
      validate: (value: unknown) =>
        value === null || (typeof value === 'string' && ID_PATTERN.test(value)),
      defaultMessage: () =>
        'parentId must be null or a positive integer string',
    },
  })
  parentId?: string | null

  @IsOptional()
  @IsString()
  @Length(1, 12)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  remark?: string | null

  @IsOptional()
  @Matches(ID_PATTERN)
  iconId?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isEnabled?: boolean
}

export class OrderItemDto {
  @Matches(ID_PATTERN)
  id!: string

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder!: number
}

export class UpdateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[]
}

export class CreateAccountDto {
  @IsString()
  @Length(1, 50)
  name!: string

  @Type(() => Number)
  @IsEnum(AccountType)
  accountType!: AccountType

  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string

  @IsIn(['CNY'])
  currency!: 'CNY'

  @Matches(AMOUNT_PATTERN)
  initialBalance!: string

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  includeInAssets?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  name?: string

  @IsOptional()
  @Type(() => Number)
  @IsEnum(AccountType)
  accountType?: AccountType

  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string

  @IsOptional()
  @Matches(AMOUNT_PATTERN)
  initialBalance?: string

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  includeInAssets?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isEnabled?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string
}

export class CreateTransactionDto {
  @Type(() => Number)
  @IsEnum(TransactionType)
  transactionType!: TransactionType

  @Matches(POSITIVE_AMOUNT_PATTERN)
  amount!: string

  @IsOptional()
  @Matches(ID_PATTERN)
  categoryId?: string

  @Matches(ID_PATTERN)
  accountId!: string

  @IsOptional()
  @Matches(ID_PATTERN)
  targetAccountId?: string

  @IsIn(['CNY'])
  currency!: 'CNY'

  @IsDateString({ strict: true })
  transactionTime!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remark?: string
}

export class UpdateTransactionDto extends CreateTransactionDto {}

export class TransactionQueryDto {
  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  currentPage = 1

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20

  @IsOptional()
  @IsDateString({ strict: true })
  startTime?: string

  @IsOptional()
  @IsDateString({ strict: true })
  endTime?: string

  @IsOptional()
  @Transform(toNumber)
  @IsEnum(TransactionType)
  transactionType?: TransactionType

  @IsOptional()
  @IsArray()
  @Matches(ID_PATTERN, { each: true })
  categoryIds?: string[]

  @IsOptional()
  @IsArray()
  @Matches(ID_PATTERN, { each: true })
  accountIds?: string[]

  @IsOptional()
  @Matches(AMOUNT_PATTERN)
  minAmount?: string

  @IsOptional()
  @Matches(AMOUNT_PATTERN)
  maxAmount?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string
}

export class MonthQueryDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month!: string
}

export class YearQueryDto {
  @Matches(/^\d{4}$/)
  year!: string
}

export class TrendQueryDto {
  @IsIn(['week', 'month', 'year', 'custom'])
  view!: 'week' | 'month' | 'year' | 'custom'

  @IsOptional()
  @IsIsoWeek()
  week?: string

  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month?: string

  @IsOptional()
  @Matches(/^\d{4}$/)
  year?: string

  @IsOptional()
  @IsDateString({ strict: true })
  startTime?: string

  @IsOptional()
  @IsDateString({ strict: true })
  endTime?: string

  @IsOptional()
  @Matches(ID_PATTERN)
  accountId?: string
}

export class CategoryReportQueryDto {
  @Type(() => Number)
  @IsIn([1, 2])
  transactionType!: 1 | 2

  @IsDateString({ strict: true })
  startTime!: string

  @IsDateString({ strict: true })
  endTime!: string

  @IsOptional()
  @Matches(ID_PATTERN)
  accountId?: string

  @IsOptional()
  @Matches(ID_PATTERN)
  parentCategoryId?: string
}
