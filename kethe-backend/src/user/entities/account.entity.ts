import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { AccountType } from '../enums/account-type.enum'

@Entity({ name: 'accounts', synchronize: false })
export class Account {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number

  @Column({ type: 'bigint', unsigned: true })
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
  initialBalance!: number

  @Column({ type: 'bigint', default: 0 })
  currentBalance!: number

  @Column({ type: 'boolean', default: true })
  includeInAssets!: boolean

  @Column({ type: 'int', unsigned: true, default: 0 })
  sortOrder!: number

  @Column({ type: 'boolean', default: true })
  isEnabled!: boolean

  @Column({ type: 'varchar', length: 255, nullable: true })
  remark!: string | null
}
