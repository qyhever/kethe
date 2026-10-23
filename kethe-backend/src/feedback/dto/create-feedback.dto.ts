import { ApiProperty } from '@nestjs/swagger'
import { IsString, ValidateBy } from 'class-validator'

export class CreateFeedbackDto {
  @ApiProperty({
    description: '反馈内容，去除首尾空白后为 1–1000 个 Unicode 码点',
    example: '希望增加更多统计图表',
    minLength: 1,
    maxLength: 1000,
  })
  @IsString({ message: '反馈内容必须是字符串' })
  @ValidateBy({
    name: 'feedbackContentLength',
    validator: {
      validate: (value: unknown) => {
        if (typeof value !== 'string') return false
        const length = [...value.trim()].length
        return length >= 1 && length <= 1000
      },
      defaultMessage: () => '反馈内容去除首尾空白后须为 1 至 1000 个字符',
    },
  })
  content!: string
}
