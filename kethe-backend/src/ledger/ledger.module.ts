import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Account } from '../user/entities/account.entity'
import { Category } from '../user/entities/category.entity'
import { CategoryIcon } from './entities/category-icon.entity'
import { Transaction } from './entities/transaction.entity'
import { ExportController } from './export.controller'
import {
  AccountController,
  CategoryController,
  CategoryIconController,
  TransactionController,
} from './ledger.controllers'
import { LedgerService } from './ledger.service'
import {
  BillController,
  DashboardController,
  ReportController,
} from './report.controllers'
import { ReportService } from './report.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Category, CategoryIcon, Transaction]),
  ],
  controllers: [
    CategoryIconController,
    CategoryController,
    AccountController,
    TransactionController,
    DashboardController,
    ReportController,
    BillController,
    ExportController,
  ],
  providers: [LedgerService, ReportService],
  exports: [LedgerService, ReportService],
})
export class LedgerModule {}
