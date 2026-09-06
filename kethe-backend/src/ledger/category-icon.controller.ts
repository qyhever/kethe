import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { LedgerService } from './ledger.service'

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
