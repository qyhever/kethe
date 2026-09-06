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
  CreateAccountDto,
  TransactionQueryDto,
  UpdateAccountDto,
  UpdateOrderDto,
} from './dto/ledger.dto'
import { LedgerService } from './ledger.service'

const userId = (request: RequestWithContext) => request.user!.id

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
