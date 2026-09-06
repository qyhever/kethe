import { Controller, Get, Query, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import type { RequestWithContext } from '../common/types/request-with-context'
import {
  CategoryReportQueryDto,
  MonthQueryDto,
  TrendQueryDto,
  YearQueryDto,
} from './dto/ledger.dto'
import { ReportService } from './report.service'

@ApiTags('首页')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly reports: ReportService) {}

  @Get('overview')
  overview(@Req() request: RequestWithContext, @Query() query: MonthQueryDto) {
    return this.reports.dashboard(request.user!.id, query)
  }
}

@ApiTags('图表')
@ApiBearerAuth()
@Controller('reports')
export class ReportController {
  constructor(private readonly reports: ReportService) {}

  @Get('trend')
  trend(@Req() request: RequestWithContext, @Query() query: TrendQueryDto) {
    return this.reports.trend(request.user!.id, query)
  }

  @Get('categories')
  categories(
    @Req() request: RequestWithContext,
    @Query() query: CategoryReportQueryDto,
  ) {
    return this.reports.categories(request.user!.id, query)
  }
}

@ApiTags('账单')
@ApiBearerAuth()
@Controller('bills')
export class BillController {
  constructor(private readonly reports: ReportService) {}

  @Get('yearly')
  yearly(@Req() request: RequestWithContext, @Query() query: YearQueryDto) {
    return this.reports.yearlyBill(request.user!.id, query)
  }

  @Get('monthly')
  monthly(@Req() request: RequestWithContext, @Query() query: MonthQueryDto) {
    return this.reports.monthlyBill(request.user!.id, query)
  }
}
