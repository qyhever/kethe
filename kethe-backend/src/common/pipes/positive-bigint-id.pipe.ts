import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'

@Injectable()
export class PositiveBigIntIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (
      !/^[1-9]\d*$/.test(value) ||
      value.length > 20 ||
      BigInt(value) > 18446744073709551615n
    ) {
      throw new BadRequestException('ID 必须是十进制正整数字符串')
    }
    return value
  }
}
