import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { PositiveBigIntIdPipe } from '../common/pipes/positive-bigint-id.pipe'
import type { RequestWithContext } from '../common/types/request-with-context'
import {
  CategoryListQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  UpdateOrderDto,
} from './dto/ledger.dto'
import { LedgerService } from './ledger.service'

const userId = (request: RequestWithContext) => request.user!.id

@ApiTags('分类')
@ApiBearerAuth()
@Controller('categories')
export class CategoryController {
  constructor(private readonly service: LedgerService) {}

  @Get()
  list(
    @Req() request: RequestWithContext,
    @Query() query: CategoryListQueryDto,
  ) {
    return this.service.listCategories(userId(request), query.categoryType)
  }

  @Post()
  create(@Req() request: RequestWithContext, @Body() dto: CreateCategoryDto) {
    return this.service.createCategory(userId(request), dto)
  }

  @Patch(':id')
  update(
    @Req() request: RequestWithContext,
    @Param('id', PositiveBigIntIdPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.service.updateCategory(userId(request), id, dto)
  }

  @Put('order')
  order(@Req() request: RequestWithContext, @Body() dto: UpdateOrderDto) {
    return this.service.orderCategories(userId(request), dto)
  }

  @Delete(':id')
  remove(
    @Req() request: RequestWithContext,
    @Param('id', PositiveBigIntIdPipe) id: string,
  ) {
    return this.service.deleteCategory(userId(request), id)
  }
}
