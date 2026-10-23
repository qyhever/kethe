import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from '../../common/entities/base.entity'
import { User } from '../../user/entities/user.entity'

@Entity({ name: 'feedbacks', synchronize: false })
@Index('idx_feedbacks_user_created', ['userId', 'createdAt'])
export class Feedback extends BaseEntity {
  @Column({ type: 'int' })
  userId!: number

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'userId', foreignKeyConstraintName: 'fk_feedbacks_user' })
  user!: User

  @Column({ type: 'varchar', length: 1000 })
  content!: string
}
