import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
@Entity({ name: 'merchants', synchronize: false })
export class Merchant {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id!: string
  @Column({ type: 'int' }) userId!: number
  @Column({ type: 'varchar', length: 30 }) name!: string
  @Column({ type: 'varchar', length: 64, default: 'store' }) iconKey!: string
  @Column({ type: 'varchar', length: 64, nullable: true }) systemKey!:
    string | null
  @Column({ type: 'boolean', default: false }) isSystemDefault!: boolean
  @Column({ type: 'int', default: 100 }) sortOrder!: number
  @CreateDateColumn({ type: 'datetime', precision: 3 }) createdAt!: Date
  @UpdateDateColumn({ type: 'datetime', precision: 3 }) updatedAt!: Date
}
