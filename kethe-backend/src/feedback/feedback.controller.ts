import { Body, Controller, Post, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { RequestWithContext } from '../common/types/request-with-context'
import { CreateFeedbackDto } from './dto/create-feedback.dto'
import { FeedbackService } from './feedback.service'

@ApiTags('意见反馈')
@ApiBearerAuth()
@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly service: FeedbackService) {}

  @Post()
  create(@Req() req: RequestWithContext, @Body() dto: CreateFeedbackDto) {
    return this.service.create(req.user!.id, dto)
  }
}
