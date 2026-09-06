import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  Res,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { Response } from 'express'
import { Transform } from 'node:stream'
import { finished } from 'node:stream/promises'
import { DataSource } from 'typeorm'
import { SkipResponseWrap } from '../common/decorators/skip-response-wrap.decorator'
import type { RequestWithContext } from '../common/types/request-with-context'
import { TransactionQueryDto } from './dto/ledger.dto'
import { LedgerService } from './ledger.service'

const csvCell = (value: unknown) => {
  const text =
    value === null || value === undefined
      ? ''
      : typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'boolean' ||
          typeof value === 'bigint'
        ? String(value)
        : (JSON.stringify(value) ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

@ApiTags('导出')
@ApiBearerAuth()
@Controller('exports')
export class ExportController {
  constructor(
    private readonly ledger: LedgerService,
    private readonly dataSource: DataSource,
  ) {}

  @Get('transactions.csv')
  @SkipResponseWrap()
  async transactions(
    @Req() request: RequestWithContext,
    @Query() query: TransactionQueryDto,
    @Res() response: Response,
  ) {
    if (!query.startTime || !query.endTime) {
      throw new BadRequestException('导出必须指定开始和结束时间')
    }
    const start = new Date(query.startTime)
    const end = new Date(query.endTime)
    if (start >= end || end.getTime() - start.getTime() > 366 * 86400000) {
      throw new BadRequestException('导出时间范围必须大于 0 且不超过 366 天')
    }
    response.setHeader('Content-Type', 'text/csv; charset=utf-8')
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="transactions.csv"',
    )
    response.write('\ufeff')
    response.write(
      '流水ID,类型,金额最小单位,币种,一级分类,二级分类,账户,目标账户,备注,记账时间,创建时间\r\n',
    )
    const stream = await this.ledger
      .transactionQuery(this.dataSource.manager, request.user!.id, query)
      .orderBy('t.transactionTime', 'DESC')
      .addOrderBy('t.id', 'DESC')
      .stream()
    const csv = new Transform({
      objectMode: true,
      transform(row: Record<string, unknown>, _encoding, callback) {
        const type =
          { 1: '支出', 2: '收入', 3: '转账' }[Number(row.transactionType)] ?? ''
        const parent = row.parentCategoryName
        const firstCategory = parent ?? row.categoryName
        const secondCategory = parent ? row.categoryName : ''
        callback(
          null,
          [
            row.id,
            type,
            row.amount,
            row.currency,
            firstCategory,
            secondCategory,
            row.accountName,
            row.targetAccountName,
            row.remark,
            new Date(String(row.transactionTime)).toISOString(),
            new Date(String(row.createdAt)).toISOString(),
          ]
            .map(csvCell)
            .join(',') + '\r\n',
        )
      },
    })
    stream.pipe(csv).pipe(response)
    await finished(response)
  }
}
