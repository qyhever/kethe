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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { RequestWithContext } from '../common/types/request-with-context'
import { PositiveBigIntIdPipe } from '../common/pipes/positive-bigint-id.pipe'
import {
  CategoryListQueryDto,
  CreateAccountDto,
  CreateCategoryDto,
  CreateTransactionDto,
  TransactionQueryDto,
  UpdateAccountDto,
  UpdateCategoryDto,
  UpdateOrderDto,
} from './dto/ledger.dto'
import { LedgerService } from './ledger.service'

const userId = (request: RequestWithContext) => request.user!.id

@ApiTags('分类图标')
@ApiBearerAuth()
@Controller('category-icons')
export class CategoryIconController {
  constructor(private readonly service: LedgerService) {}

  @Get()
  @ApiOperation({ summary: '查询可用分类图标' })
  list() {
    return this.service.listIcons()
  }
}

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

@ApiTags('账户')
@ApiBearerAuth()
@Controller('accounts')
export class AccountController {
  constructor(private readonly service: LedgerService) {}

  @Get()
  list(@Req() request: RequestWithContext) {
    return this.service.listAccounts(userId(request))
  }

  @Get(':id/transactions')
  transactions(
    @Req() request: RequestWithContext,
    @Param('id', PositiveBigIntIdPipe) id: string,
    @Query() query: TransactionQueryDto,
  ) {
    return this.service.listTransactions(userId(request), {
      ...query,
      accountId: id,
    })
  }

  @Get(':id')
  detail(
    @Req() request: RequestWithContext,
    @Param('id', PositiveBigIntIdPipe) id: string,
  ) {
    return this.service.getAccount(userId(request), id)
  }

  @Post()
  create(@Req() request: RequestWithContext, @Body() dto: CreateAccountDto) {
    return this.service.createAccount(userId(request), dto)
  }

  @Patch(':id')
  update(
    @Req() request: RequestWithContext,
    @Param('id', PositiveBigIntIdPipe) id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.service.updateAccount(userId(request), id, dto)
  }

  @Put('order')
  order(@Req() request: RequestWithContext, @Body() dto: UpdateOrderDto) {
    return this.service.orderAccounts(userId(request), dto)
  }

  @Delete(':id')
  remove(
    @Req() request: RequestWithContext,
    @Param('id', PositiveBigIntIdPipe) id: string,
  ) {
    return this.service.deleteAccount(userId(request), id)
  }
}

@ApiTags('流水')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionController {
  constructor(private readonly service: LedgerService) {}

  @Get()
  list(
    @Req() request: RequestWithContext,
    @Query() query: TransactionQueryDto,
  ) {
    return this.service.listTransactions(userId(request), query)
  }

  @Get(':id')
  detail(
    @Req() request: RequestWithContext,
    @Param('id', PositiveBigIntIdPipe) id: string,
  ) {
    return this.service.getTransaction(userId(request), id)
  }

  @Post()
  create(
    @Req() request: RequestWithContext,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.service.createTransaction(userId(request), dto)
  }

  @Patch(':id')
  update(
    @Req() request: RequestWithContext,
    @Param('id', PositiveBigIntIdPipe) id: string,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.service.updateTransaction(userId(request), id, dto)
  }

  @Delete(':id')
  remove(
    @Req() request: RequestWithContext,
    @Param('id', PositiveBigIntIdPipe) id: string,
  ) {
    return this.service.deleteTransaction(userId(request), id)
  }
}
