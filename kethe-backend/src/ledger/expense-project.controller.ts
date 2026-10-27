import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Query,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { PositiveBigIntIdPipe } from '../common/pipes/positive-bigint-id.pipe'
import type { RequestWithContext } from '../common/types/request-with-context'
import {
  CreateExpenseProjectDto,
  UpdateExpenseProjectDto,
  ExpenseProjectQueryDto,
  ExpenseProjectCategoriesDto,
} from './dto/expense-project.dto'
import { ExpenseProjectService } from './expense-project.service'

@ApiTags('消费项目')
@ApiBearerAuth()
@Controller('expense-projects')
export class ExpenseProjectController {
  constructor(private readonly service: ExpenseProjectService) {}
  @Get()
  list(@Req() req: RequestWithContext, @Query() query: ExpenseProjectQueryDto) {
    return this.service.list(req.user!.id, query.status)
  }
  @Get('options')
  options() {
    return this.service.options()
  }
  @Get(':id/categories')
  categories(
    @Req() req: RequestWithContext,
    @Param('id', PositiveBigIntIdPipe) id: string,
    @Query() query: ExpenseProjectCategoriesDto,
  ) {
    return this.service.categories(req.user!.id, id, query.parentCategoryId)
  }
  @Get(':id')
  get(
    @Req() req: RequestWithContext,
    @Param('id', PositiveBigIntIdPipe) id: string,
  ) {
    return this.service.get(req.user!.id, id)
  }
  @Post()
  create(@Req() req: RequestWithContext, @Body() dto: CreateExpenseProjectDto) {
    return this.service.create(req.user!.id, dto)
  }
  @Patch(':id')
  update(
    @Req() req: RequestWithContext,
    @Param('id', PositiveBigIntIdPipe) id: string,
    @Body() dto: UpdateExpenseProjectDto,
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
