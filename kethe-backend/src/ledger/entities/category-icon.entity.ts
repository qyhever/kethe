import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'category_icons', synchronize: false })
export class CategoryIcon {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ type: 'varchar', length: 64 })
  iconKey!: string

  @Column({ type: 'varchar', length: 64 })
  iconName!: string

  @Column({ type: 'mediumtext' })
  svgContent!: string

  @Column({ type: 'boolean', default: true })
  isSystemDefault!: boolean

  @Column({ type: 'boolean', default: true })
  isEnabled!: boolean
}
