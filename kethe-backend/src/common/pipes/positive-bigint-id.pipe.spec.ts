import { BadRequestException } from '@nestjs/common'
import { PositiveBigIntIdPipe } from './positive-bigint-id.pipe'

describe('PositiveBigIntIdPipe', () => {
  const pipe = new PositiveBigIntIdPipe()

  it('保留超过 JavaScript 安全整数范围的 ID 字符串', () => {
    expect(pipe.transform('9007199254740993')).toBe('9007199254740993')
  })

  it.each(['0', '-1', '1.5', 'abc'])('拒绝非法 ID %s', (id) => {
    expect(() => pipe.transform(id)).toThrow(BadRequestException)
  })
})
