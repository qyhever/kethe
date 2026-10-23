import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
@Entity({ name: 'expense_projects', synchronize: false })
export class ExpenseProject {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id!: string
  @Column({ type: 'int' }) userId!: number
  @Column({ type: 'varchar', length: 30 }) name!: string
  @Column({ type: 'varchar', length: 64, default: 'folder' }) iconKey!: string
  @Column({ type: 'date', nullable: true }) startDate!: string | null
  @Column({ type: 'date', nullable: true }) endDate!: string | null
  @Column({ type: 'varchar', length: 500, nullable: true }) remark!:
    string | null
  @Column({ type: 'boolean', default: false }) isArchived!: boolean
  @DeleteDateColumn({ type: 'datetime', precision: 3, nullable: true })
  deletedAt!: Date | null
  @CreateDateColumn({ type: 'datetime', precision: 3 }) createdAt!: Date
  @UpdateDateColumn({ type: 'datetime', precision: 3 }) updatedAt!: Date
}
