import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { PositiveBigIntIdPipe } from '../common/pipes/positive-bigint-id.pipe'
import type { RequestWithContext } from '../common/types/request-with-context'
import { CreateMemberDto, UpdateMemberDto } from './dto/member.dto'
import { MemberService } from './member.service'

@ApiTags('成员')
@ApiBearerAuth()
@Controller('members')
export class MemberController {
  constructor(private readonly service: MemberService) {}
  @Get()
  list(@Req() req: RequestWithContext) {
    return this.service.list(req.user!.id)
  }
  @Get('options')
  options() {
    return this.service.options()
  }
  @Get(':id')
  get(
    @Req() req: RequestWithContext,
    @Param('id', PositiveBigIntIdPipe) id: string,
  ) {
    return this.service.get(req.user!.id, id)
  }
  @Post()
  create(@Req() req: RequestWithContext, @Body() dto: CreateMemberDto) {
    return this.service.create(req.user!.id, dto)
  }
  @Patch(':id')
  update(
    @Req() req: RequestWithContext,
    @Param('id', PositiveBigIntIdPipe) id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.service.update(req.user!.id, id, dto)
  }
  @Delete(':id')
  remove(
    @Req() req: RequestWithContext,
    @Param('id', PositiveBigIntIdPipe) id: string,
  ) {
    return this.service.remove(req.user!.id, id)
  }
}
