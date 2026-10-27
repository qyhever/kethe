import { BadRequestException, Injectable } from '@nestjs/common'
import { createHash } from 'node:crypto'
import { DataSource, type EntityManager } from 'typeorm'
import { sanitizeSvg } from './sanitize-svg'

export const ICON_SCENES = [
  'category',
  'account',
  'member',
  'expense-project',
  'merchant',
] as const
export type IconScene = (typeof ICON_SCENES)[number]
export interface IconOption {
  id: string
  scene: IconScene
  iconKey: string
  iconName: string
  groupKey: string
  svgContent: string
  color: string | null
  isEnabled: boolean
  isDefault: boolean
  sortOrder: number
}
interface AccountRule {
  iconKey: string
  accountType: number
  accountSubType: number
  isDefault: boolean
}

@Injectable()
export class IconService {
  constructor(private readonly dataSource: DataSource) {}

  async list(
    scene?: IconScene,
    selectableOnly = false,
    manager: EntityManager = this.dataSource.manager,
  ): Promise<IconOption[]> {
    const rows = await manager.query<IconOption[]>(
      `SELECT CAST(o.id AS CHAR) id, o.scene, o.iconKey, o.label iconName,
       o.groupKey, r.svgContent, r.color, (o.isEnabled AND r.isEnabled) isEnabled,
       o.isDefault, o.sortOrder
       FROM icon_scene_options o JOIN icon_resources r ON r.id = o.resourceId
       WHERE (? IS NULL OR o.scene = ?) ${selectableOnly ? 'AND o.isEnabled = 1 AND r.isEnabled = 1' : ''}
       ORDER BY o.scene, o.sortOrder, o.id`,
      [scene ?? null, scene ?? null],
    )
    return rows.map((row) => ({
      ...row,
      id: String(row.id),
      isEnabled: Boolean(row.isEnabled),
      isDefault: Boolean(row.isDefault),
      svgContent: sanitizeSvg(row.svgContent),
    }))
  }

  async catalog(scene?: IconScene, selectableOnly = false) {
    const items = await this.list(scene, selectableOnly)
    return {
      version: createHash('sha256').update(JSON.stringify(items)).digest('hex'),
      items,
    }
  }

  async keys(scene: IconScene) {
    return (await this.list(scene, true)).map((item) => item.iconKey)
  }

  async validate(
    scene: IconScene,
    iconKey: string,
    currentKey?: string | null,
    manager?: EntityManager,
  ) {
    const item = (await this.list(scene, false, manager)).find(
      (item) => item.iconKey === iconKey,
    )
    if (!item || (!item.isEnabled && iconKey !== currentKey))
      throw new BadRequestException('图标不存在、已停用或不适用于当前场景')
    return item
  }

  async defaultKey(scene: IconScene, manager?: EntityManager) {
    const item = (await this.list(scene, true, manager)).find(
      (item) => item.isDefault,
    )
    if (!item) throw new BadRequestException('当前场景未配置可用的默认图标')
    return item.iconKey
  }

  async accountRules(manager: EntityManager = this.dataSource.manager) {
    return manager.query<
      AccountRule[]
    >(`SELECT o.iconKey, a.accountType, a.accountSubType, a.isDefault
      FROM account_icon_rules a JOIN icon_scene_options o ON o.id = a.optionId
      WHERE o.scene = 'account' ORDER BY o.sortOrder, o.id, a.accountType, a.accountSubType`)
  }

  async accountOptions() {
    const [items, rules] = await Promise.all([
      this.list('account', true),
      this.accountRules(),
    ])
    return items.map((item) => ({
      key: item.iconKey,
      label: item.iconName,
      groupKey: item.groupKey,
      supportedTypes: [
        ...new Set(
          rules
            .filter((rule) => rule.iconKey === item.iconKey)
            .map((rule) => rule.accountType),
        ),
      ],
      defaultFor: rules
        .filter((rule) => rule.iconKey === item.iconKey && rule.isDefault)
        .map((rule) => ({
          accountType: rule.accountType,
          accountSubType: rule.accountSubType || null,
        })),
    }))
  }

  async validateAccount(
    iconKey: string,
    accountType: number,
    currentKey?: string | null,
    manager?: EntityManager,
  ) {
    await this.validate('account', iconKey, currentKey, manager)
    if (
      !(await this.accountRules(manager)).some(
        (rule) => rule.iconKey === iconKey && rule.accountType === accountType,
      )
    )
      throw new BadRequestException('账户图标不适用于当前账户类型')
  }

  async defaultAccountKey(
    accountType: number,
    accountSubType: number | null,
    manager?: EntityManager,
  ) {
    const [items, rules] = await Promise.all([
      this.list('account', true, manager),
      this.accountRules(manager),
    ])
    const available = new Set(items.map((item) => item.iconKey))
    const defaults = rules.filter(
      (rule) =>
        rule.accountType === accountType &&
        rule.isDefault &&
        available.has(rule.iconKey),
    )
    const match =
      defaults.find((rule) => rule.accountSubType === accountSubType) ??
      defaults.find((rule) => rule.accountSubType === 0)
    if (!match)
      throw new BadRequestException('当前账户类型未配置可用的默认图标')
    return match.iconKey
  }
}
