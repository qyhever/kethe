import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

@Index('uk_members_user_system', ['userId', 'systemKey'], { unique: true })
@Entity({ name: 'members', synchronize: false })
export class Member {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string

  @Column({ type: 'int' })
  userId!: number

  @Column({ type: 'varchar', length: 12 })
  name!: string

  @Column({ type: 'varchar', length: 64 })
  iconKey!: string

  @Column({ type: 'varchar', length: 64, nullable: true })
  systemKey!: string | null

  @Column({ type: 'boolean', default: false })
  isSystemDefault!: boolean

  @Column({ type: 'int', unsigned: true, default: 0 })
  sortOrder!: number

  @DeleteDateColumn({ type: 'datetime', precision: 3, nullable: true })
  deletedAt!: Date | null

  @CreateDateColumn({ type: 'datetime', precision: 3 })
  createdAt!: Date

  @UpdateDateColumn({ type: 'datetime', precision: 3 })
  updatedAt!: Date
}
