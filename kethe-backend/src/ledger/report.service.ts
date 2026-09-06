import { BadRequestException, Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import isoWeek from 'dayjs/plugin/isoWeek'
import {
  CategoryReportQueryDto,
  MonthQueryDto,
  TransactionQueryDto,
  TrendQueryDto,
  YearQueryDto,
} from './dto/ledger.dto'
import { Transaction } from './entities/transaction.entity'
import { LedgerService } from './ledger.service'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isoWeek)
const ZONE = 'Asia/Shanghai'

interface SummaryRow {
  income: string | null
  expense: string | null
}

@Injectable()
export class ReportService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly ledger: LedgerService,
  ) {}

  async dashboard(userId: number, query: MonthQueryDto) {
    const month = this.monthRange(query.month)
    const now = dayjs().tz(ZONE)
    const today = this.range(
      now.startOf('day'),
      now.add(1, 'day').startOf('day'),
    )
    const week = this.range(
      now.startOf('isoWeek'),
      now.startOf('isoWeek').add(1, 'week'),
    )
    const [monthSummary, todaySummary, weekSummary, recent] = await Promise.all(
      [
        this.summary(userId, month.start, month.end),
        this.summary(userId, today.start, today.end),
        this.summary(userId, week.start, week.end),
        this.ledger.listTransactions(
          userId,
          Object.assign(new TransactionQueryDto(), { pageSize: 10 }),
        ),
      ],
    )
    return {
      month: this.withBalance(monthSummary),
      today: this.withBalance(todaySummary),
      week: this.withBalance(weekSummary),
      recent: { list: recent.list, groups: recent.groups },
    }
  }

  async trend(userId: number, query: TrendQueryDto) {
    let start: Date
    let end: Date
    let unit: 'day' | 'month' = 'day'
    if (query.view === 'month') {
      if (!query.month) throw new BadRequestException('月视图必须提供 month')
      ;({ start, end } = this.monthRange(query.month))
    } else if (query.view === 'year') {
      if (!query.year) throw new BadRequestException('年视图必须提供 year')
      ;({ start, end } = this.yearRange(query.year))
      unit = 'month'
    } else {
      if (!query.startTime || !query.endTime)
        throw new BadRequestException('自定义视图必须提供开始和结束时间')
      start = new Date(query.startTime)
      end = new Date(query.endTime)
      if (start >= end)
        throw new BadRequestException('结束时间必须晚于开始时间')
    }
    const format = unit === 'month' ? '%Y-%m' : '%Y-%m-%d'
    const rows = await this.dataSource
      .getRepository(Transaction)
      .createQueryBuilder('t')
      .select(
        `DATE_FORMAT(CONVERT_TZ(t.transactionTime, '+00:00', '+08:00'), '${format}')`,
        'period',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN t.transactionType = 1 THEN t.amount ELSE 0 END), 0)',
        'expense',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN t.transactionType = 2 THEN t.amount ELSE 0 END), 0)',
        'income',
      )
      .where(
        't.userId = :userId AND t.transactionTime >= :start AND t.transactionTime < :end',
        { userId, start, end },
      )
      .andWhere('t.transactionType IN (1, 2)')
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany<{ period: string; income: string; expense: string }>()
    const byPeriod = new Map(rows.map((row) => [row.period, row]))
    const cursor = dayjs(start).tz(ZONE).startOf(unit)
    const finish = dayjs(end).tz(ZONE)
    const points: Array<{ period: string; income: string; expense: string }> =
      []
    for (let date = cursor; date.isBefore(finish); date = date.add(1, unit)) {
      const period = date.format(unit === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD')
      const row = byPeriod.get(period)
      points.push({
        period,
        income: String(row?.income ?? '0'),
        expense: String(row?.expense ?? '0'),
      })
    }
    return { view: query.view, points }
  }

  async categories(userId: number, query: CategoryReportQueryDto) {
    if (new Date(query.startTime) >= new Date(query.endTime)) {
      throw new BadRequestException('结束时间必须晚于开始时间')
    }
    const qb = this.dataSource
      .getRepository(Transaction)
      .createQueryBuilder('t')
      .innerJoin('categories', 'c', 'c.id = t.categoryId')
      .leftJoin('categories', 'p', 'p.id = c.parentId')
      .select(
        query.parentCategoryId ? 'c.id' : 'COALESCE(p.id, c.id)',
        'categoryId',
      )
      .addSelect(
        query.parentCategoryId ? 'c.name' : 'COALESCE(p.name, c.name)',
        'categoryName',
      )
      .addSelect('SUM(t.amount)', 'amount')
      .where('t.userId = :userId AND t.transactionType = :transactionType', {
        userId,
        transactionType: query.transactionType,
      })
      .andWhere('t.transactionTime >= :start AND t.transactionTime < :end', {
        start: new Date(query.startTime),
        end: new Date(query.endTime),
      })
    if (query.accountId)
      qb.andWhere('t.accountId = :accountId', { accountId: query.accountId })
    if (query.parentCategoryId)
      qb.andWhere('c.parentId = :parentId', {
        parentId: query.parentCategoryId,
      })
    qb.groupBy('categoryId')
      .addGroupBy('categoryName')
      .orderBy('amount', 'DESC')
    const rows = await qb.getRawMany<{
      categoryId: string
      categoryName: string
      amount: string
    }>()
    const total = rows.reduce((sum, row) => sum + BigInt(row.amount), 0n)
    return {
      total: total.toString(),
      list: rows.map((row) => ({
        categoryId: String(row.categoryId),
        categoryName: row.categoryName,
        amount: String(row.amount),
        percentage:
          total === 0n
            ? 0
            : Number((BigInt(row.amount) * 10000n) / total) / 100,
      })),
    }
  }

  async yearlyBill(userId: number, query: YearQueryDto) {
    const range = this.yearRange(query.year)
    const trend = await this.trend(userId, { view: 'year', year: query.year })
    const summary = await this.summary(userId, range.start, range.end)
    return {
      year: query.year,
      ...this.withBalance(summary),
      months: trend.points,
    }
  }

  async monthlyBill(userId: number, query: MonthQueryDto) {
    const range = this.monthRange(query.month)
    const [summary, trend, categories, transactions] = await Promise.all([
      this.summary(userId, range.start, range.end),
      this.trend(userId, { view: 'month', month: query.month }),
      Promise.all(
        [1, 2].map((transactionType) =>
          this.categories(userId, {
            transactionType: transactionType as 1 | 2,
            startTime: range.start.toISOString(),
            endTime: range.end.toISOString(),
          }),
        ),
      ),
      this.ledger.listAllTransactions(
        userId,
        Object.assign(new TransactionQueryDto(), {
          startTime: range.start.toISOString(),
          endTime: range.end.toISOString(),
        }),
      ),
    ])
    return {
      month: query.month,
      ...this.withBalance(summary),
      dailyTrend: trend.points,
      categories: { expense: categories[0], income: categories[1] },
      transactions,
      transactionTotal: transactions.length,
    }
  }

  private async summary(
    userId: number,
    start: Date,
    end: Date,
  ): Promise<{ income: string; expense: string }> {
    const row = (await this.dataSource
      .getRepository(Transaction)
      .createQueryBuilder('t')
      .select(
        'COALESCE(SUM(CASE WHEN t.transactionType = 1 THEN t.amount ELSE 0 END), 0)',
        'expense',
      )
      .addSelect(
        'COALESCE(SUM(CASE WHEN t.transactionType = 2 THEN t.amount ELSE 0 END), 0)',
        'income',
      )
      .where(
        't.userId = :userId AND t.transactionTime >= :start AND t.transactionTime < :end',
        { userId, start, end },
      )
      .andWhere('t.transactionType IN (1, 2)')
      .getRawOne()) as SummaryRow
    return {
      income: String(row.income ?? '0'),
      expense: String(row.expense ?? '0'),
    }
  }

  private withBalance(summary: { income: string; expense: string }) {
    return {
      ...summary,
      balance: (BigInt(summary.income) - BigInt(summary.expense)).toString(),
    }
  }

  private monthRange(month: string) {
    const start = dayjs.tz(`${month}-01`, ZONE).startOf('month')
    return this.range(start, start.add(1, 'month'))
  }

  private yearRange(year: string) {
    const start = dayjs.tz(`${year}-01-01`, ZONE).startOf('year')
    return this.range(start, start.add(1, 'year'))
  }

  private range(start: dayjs.Dayjs, end: dayjs.Dayjs) {
    return { start: start.utc().toDate(), end: end.utc().toDate() }
  }
}
