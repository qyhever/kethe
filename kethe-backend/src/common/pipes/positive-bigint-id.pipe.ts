import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'

@Injectable()
export class PositiveBigIntIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!/^[1-9]\d*$/.test(value)) {
      throw new BadRequestException('ID 必须是十进制正整数字符串')
    }
    return value
  }
}
