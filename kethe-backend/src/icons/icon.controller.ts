import { Controller, Get, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean, IsIn, IsOptional } from 'class-validator'
import { ICON_SCENES, IconService, type IconScene } from './icon.service'

class IconQueryDto {
  @IsOptional() @IsIn(ICON_SCENES) scene?: IconScene
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  selectableOnly?: boolean
}
@ApiTags('图标')
@ApiBearerAuth()
@Controller('icons')
export class IconController {
  constructor(private readonly icons: IconService) {}
  @Get()
  list(@Query() query: IconQueryDto) {
    return this.icons.catalog(query.scene, query.selectableOnly)
  }
}
