import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'categories', synchronize: false })
export class Category {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number

  @Column({ type: 'bigint', unsigned: true })
  userId!: number

  @Column({ type: 'tinyint', unsigned: true })
  categoryType!: number

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  parentId!: number | null

  @Column({ type: 'varchar', length: 50 })
  name!: string

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  iconId!: number | null

  @Column({ type: 'varchar', length: 64, nullable: true })
  systemKey!: string | null

  @Column({ type: 'boolean', default: false })
  isSystemDefault!: boolean

  @Column({ type: 'int', unsigned: true, default: 0 })
  sortOrder!: number

  @Column({ type: 'boolean', default: true })
  isEnabled!: boolean
}
