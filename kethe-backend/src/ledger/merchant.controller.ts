import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { PositiveBigIntIdPipe } from '../common/pipes/positive-bigint-id.pipe'
import type { RequestWithContext } from '../common/types/request-with-context'
import {
  CreateMerchantDto,
  UpdateMerchantDto,
  MERCHANT_ICONS,
} from './dto/merchant.dto'
import { MerchantService } from './merchant.service'

@ApiTags('商家')
@ApiBearerAuth()
@Controller('merchants')
export class MerchantController {
  constructor(private readonly service: MerchantService) {}
  @Get()
  list(@Req() req: RequestWithContext) {
    return this.service.list(req.user!.id)
  }
  @Get('options')
  options() {
    return MERCHANT_ICONS
  }
  @Get(':id')
  get(
    @Req() req: RequestWithContext,
    @Param('id', PositiveBigIntIdPipe) id: string,
  ) {
    return this.service.get(req.user!.id, id)
  }
  @Post()
  create(@Req() req: RequestWithContext, @Body() dto: CreateMerchantDto) {
    return this.service.create(req.user!.id, dto)
  }
  @Patch(':id')
  update(
    @Req() req: RequestWithContext,
    @Param('id', PositiveBigIntIdPipe) id: string,
    @Body() dto: UpdateMerchantDto,
  ) {
    return this.service.update(req.user!.id, id, dto)
  }
}
