import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { PositiveBigIntIdPipe } from '../common/pipes/positive-bigint-id.pipe'
import type { RequestWithContext } from '../common/types/request-with-context'
import { CreateTransactionDto, TransactionQueryDto } from './dto/ledger.dto'
import { LedgerService } from './ledger.service'

const userId = (request: RequestWithContext) => request.user!.id

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
