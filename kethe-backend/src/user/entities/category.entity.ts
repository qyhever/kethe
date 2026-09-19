import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity({ name: 'categories', synchronize: false })
export class Category {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ type: 'int' })
  userId!: number

  @Column({ type: 'tinyint', unsigned: true })
  categoryType!: number

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  parentId!: string | null

  @Column({ type: 'varchar', length: 12 })
  name!: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  remark!: string | null

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  iconId!: string | null

  @Column({ type: 'varchar', length: 64, nullable: true })
  systemKey!: string | null

  @Column({ type: 'boolean', default: false })
  isSystemDefault!: boolean

  @Column({ type: 'int', unsigned: true, default: 0 })
  sortOrder!: number

  @Column({ type: 'boolean', default: true })
  isEnabled!: boolean

  @DeleteDateColumn({ type: 'datetime', precision: 3, nullable: true })
  deletedAt!: Date | null

  @CreateDateColumn({ type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ type: 'datetime', precision: 3 })
  updatedAt!: Date
}
