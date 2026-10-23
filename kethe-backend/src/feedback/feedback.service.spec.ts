import { Test } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Feedback } from './entities/feedback.entity'
import { FeedbackService } from './feedback.service'

describe('FeedbackService', () => {
  const repository = {
    create: jest.fn<Feedback, [Partial<Feedback>]>(),
    save: jest.fn<Promise<Feedback>, [Feedback]>(),
  }
  let service: FeedbackService

  beforeEach(async () => {
    jest.resetAllMocks()
    repository.create.mockImplementation((data) =>
      Object.assign(new Feedback(), data),
    )
    repository.save.mockImplementation((feedback) =>
      Promise.resolve(Object.assign(feedback, { id: 7 })),
    )
    const module = await Test.createTestingModule({
      providers: [
        FeedbackService,
        { provide: getRepositoryToken(Feedback), useValue: repository },
      ],
    }).compile()
    service = module.get(FeedbackService)
  })

  it('保存认证用户与去除首尾空白的内容，仅返回 ID', async () => {
    await expect(
      service.create(42, { content: '\t 建议支持更多图表 😀 \n' }),
    ).resolves.toEqual({ id: 7 })
    expect(repository.create).toHaveBeenCalledWith({
      userId: 42,
      content: '建议支持更多图表 😀',
    })
    expect(repository.save).toHaveBeenCalledTimes(1)
    expect(repository.save.mock.calls[0][0]).toBeInstanceOf(Feedback)
  })

  it('传播保存失败，不返回成功结果', async () => {
    const error = new Error('database unavailable')
    repository.save.mockRejectedValue(error)
    await expect(service.create(42, { content: '建议' })).rejects.toBe(error)
  })
})
