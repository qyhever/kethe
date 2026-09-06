import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export enum TransactionType {
  EXPENSE = 1,
  INCOME = 2,
  TRANSFER = 3,
}

@Entity({ name: 'transactions', synchronize: false })
export class Transaction {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ type: 'int' })
  userId!: number

  @Column({ type: 'tinyint', unsigned: true })
  transactionType!: TransactionType

  @Column({ type: 'bigint', unsigned: true })
  amount!: string

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  categoryId!: string | null

  @Column({ type: 'bigint', unsigned: true })
  accountId!: string

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  targetAccountId!: string | null

  @Column({ type: 'char', length: 3, default: 'CNY' })
  currency!: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  remark!: string | null

  @Column({ type: 'datetime', precision: 3 })
  transactionTime!: Date

  @DeleteDateColumn({ type: 'datetime', precision: 3, nullable: true })
  deletedAt!: Date | null

  @CreateDateColumn({ type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ type: 'datetime', precision: 3 })
  updatedAt!: Date
}
