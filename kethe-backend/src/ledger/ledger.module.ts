import { MemberController } from './member.controller'
import { MemberService } from './member.service'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Member } from '../user/entities/member.entity'
import { Account } from '../user/entities/account.entity'
import { Category } from '../user/entities/category.entity'
import { AccountController } from './account.controller'
import { CategoryIconController } from './category-icon.controller'
import { CategoryController } from './category.controller'
import { CategoryIcon } from './entities/category-icon.entity'
import { Transaction } from './entities/transaction.entity'
import { ExportController } from './export.controller'
import { LedgerService } from './ledger.service'
import {
  BillController,
  DashboardController,
  ReportController,
} from './report.controllers'
import { ReportService } from './report.service'
import { TransactionController } from './transaction.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Category,
      CategoryIcon,
      Transaction,
      Member,
    ]),
  ],
  controllers: [
    CategoryIconController,
    CategoryController,
    AccountController,
    MemberController,
    TransactionController,
    DashboardController,
    ReportController,
    BillController,
    ExportController,
  ],
  providers: [LedgerService, ReportService, MemberService],
  exports: [LedgerService, ReportService],
})
export class LedgerModule {}
