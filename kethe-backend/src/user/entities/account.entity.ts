import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { AccountType } from '../enums/account-type.enum'

@Entity({ name: 'accounts', synchronize: false })
export class Account {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ type: 'int' })
  userId!: number

  @Column({ type: 'varchar', length: 50 })
  name!: string

  @Column({ type: 'tinyint', unsigned: true })
  accountType!: AccountType

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon!: string | null

  @Column({ type: 'varchar', length: 64, nullable: true })
  systemKey!: string | null

  @Column({ type: 'boolean', default: false })
  isSystemDefault!: boolean

  @Column({ type: 'char', length: 3, default: 'CNY' })
  currency!: string

  @Column({ type: 'bigint', default: 0 })
  initialBalance!: string

  @Column({ type: 'bigint', default: 0 })
  currentBalance!: string

  @Column({ type: 'boolean', default: true })
  includeInAssets!: boolean

  @Column({ type: 'int', unsigned: true, default: 0 })
  sortOrder!: number

  @Column({ type: 'boolean', default: true })
  isEnabled!: boolean

  @Column({ type: 'varchar', length: 255, nullable: true })
  remark!: string | null

  @DeleteDateColumn({ type: 'datetime', precision: 3, nullable: true })
  deletedAt!: Date | null

  @CreateDateColumn({ type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ type: 'datetime', precision: 3 })
  updatedAt!: Date
}
