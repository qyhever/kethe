import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateFeedbackDto } from './dto/create-feedback.dto'
import { Feedback } from './entities/feedback.entity'

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly repository: Repository<Feedback>,
  ) {}

  async create(
    userId: number,
    dto: CreateFeedbackDto,
  ): Promise<{ id: number }> {
    const feedback = this.repository.create({
      userId,
      content: dto.content.trim(),
    })
    const saved = await this.repository.save(feedback)
    return { id: saved.id }
  }
}
